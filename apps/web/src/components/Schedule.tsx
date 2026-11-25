import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LifeDay, LifeWeek, SlotActual, SlotPlan, Task, WeekPlan } from '@productiveme/api-client';
import { toApiDomainId, useApi, useHomeStatus } from '../lib/api.js';
import { WeeklyTasks } from './Tasks.js';
import QuerySection from './QuerySection.js';
import { ProgressBar } from './bits.js';
import { domains } from '../types.js';

const days: LifeDay[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const blocks = Array.from({ length: 12 }, (_, block) => block);
const protections = { sat: 'Sat exercise', sun: 'Sun church', wed: 'Wed rest', fri: 'Fri friends' } as const;
const protectionDays = ['sat', 'sun', 'wed', 'fri'] as const;
const categories: SlotPlan['cat'][] = ['sleep', 'career', 'rest', 'church', 'exercise', 'games', 'meal', 'other'];

const blockLabel = (block: number) => `${String(block * 2).padStart(2, '0')}:00`;
type Selection = { day: LifeDay; block: number };
type Mode = 'plan' | 'record';

function useSchedule(week: string) {
  const api = useApi();
  const client = useQueryClient();
  return {
    life: useQuery({ queryKey: ['life', week], queryFn: () => api.getLifeWeek(week) }),
    tasks: useQuery({ queryKey: ['tasks', week], queryFn: () => api.getTasks({ week }) }),
    async refresh() {
      await Promise.all([client.invalidateQueries({ queryKey: ['life', week] }), client.invalidateQueries({ queryKey: ['week-plan', week] })]);
    },
  };
}

function SlotEditor({ week, selection, mode, data, tasks, onSaved, onClose, inline = false }: {
  week: string; selection: Selection; mode: Mode; data: LifeWeek; tasks: Task[]; inline?: boolean; onSaved: () => Promise<void>; onClose: () => void;
}) {
  const api = useApi();
  const ref = useRef<HTMLDialogElement>(null);
  const { day, block } = selection;
  const slot = data[day]?.[block];
  const plan = slot?.plan;
  const record = slot?.act;
  const current = mode === 'plan' ? plan : record ?? plan;
  const assigned = new Set(Object.values(data).flatMap((date) =>
    Object.values(date).flatMap((cell) => cell.plan?.taskId ? [cell.plan.taskId] : []),
  ));
  const mutation = useMutation({
    mutationFn: async (value: SlotPlan | SlotActual | null) => {
      if (mode === 'plan') await api.saveSlotPlan(week, day, block, value as SlotPlan | null);
      else await api.saveSlotActual(week, day, block, value as SlotActual | null);
    },
    onSuccess: async () => { await onSaved(); if (!inline) onClose(); },
  });

  useEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => { if (trigger instanceof HTMLElement) trigger.focus(); };
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get('title') ?? '').trim();
    if (!title) return;
    const cat = categories.find((entry) => entry === form.get('cat')) ?? 'other';
    const note = String(form.get('note') ?? '').trim();
    const base = { title, cat, ...(note ? { note } : {}) };
    if (mode === 'record') {
      const status = form.get('status');
      mutation.mutate({ ...base, status: status === 'changed' || status === 'skipped' ? status : 'asplan' });
    } else {
      const taskId = String(form.get('taskId') ?? '');
      mutation.mutate({ ...base, ...(taskId ? { taskId } : {}) });
    }
  };

  const editor = (
      <form onSubmit={submit}>
        <div><p className="handoff-eyebrow mono">{mode === 'plan' ? 'Plan block' : 'Record block'}</p>
          <h2 className="hf" id="slot-title">{day.toUpperCase()} · {blockLabel(block)}</h2></div>
        {inline && <div className="life-slot-context mono">
          <span>Plan · {plan?.title ?? 'Open'}</span><span>Actual · {record?.title ?? 'Not recorded'}</span>
        </div>}
        <label>Title <input name="title" defaultValue={current?.title} maxLength={500} required /></label>
        <label>Category <select name="cat" defaultValue={current?.cat ?? 'other'}>{categories.map((cat) => <option key={cat}>{cat}</option>)}</select></label>
        <label>Note <input name="note" defaultValue={current?.note} maxLength={4000} /></label>
        {mode === 'plan' ? (
          <label>Linked task <select name="taskId" defaultValue={plan?.taskId ?? ''}>
            <option value="">No task</option>
            {tasks.filter(({ id }) => id === plan?.taskId || !assigned.has(id)).map(({ id, text }) => <option value={id} key={id}>{text}</option>)}
          </select></label>
        ) : (
          <label>Outcome <select name="status" defaultValue={record?.status ?? 'asplan'}>
            <option value="asplan">As planned</option><option value="changed">Changed</option><option value="skipped">Skipped</option>
          </select></label>
        )}
        {mutation.isError && <p role="alert">{mutation.error.message}</p>}
        <div className="task-actions">
          {(mode === 'plan' ? plan : record) && <button className="shell-button" type="button" disabled={mutation.isPending} onClick={() => mutation.mutate(null)}>Clear</button>}
          <button className="shell-button" type="button" onClick={onClose}>Cancel</button>
          <button className="shell-button" type="submit" disabled={mutation.isPending}>Save {mode}</button>
        </div>
      </form>
  );
  if (inline) return <section className="task-dialog-inline" aria-labelledby="slot-title">{editor}</section>;
  return (
    <dialog ref={ref} className="task-dialog" aria-labelledby="slot-title" onCancel={(event) => { event.preventDefault(); onClose(); }}>
      {editor}
    </dialog>
  );
}

function Timetable({ week, day, mode = 'plan' }: { week: string; day?: LifeDay; mode?: Mode }) {
  const { life, tasks, refresh } = useSchedule(week);
  const [selection, setSelection] = useState<Selection | null>(null);
  const visible = day ? [day] : days;
  const data = life.data ?? {};
  const displayed = Object.values(data).flatMap((slots) => Object.values(slots));
  const lifeSelection = day ? selection ?? { day, block: blocks.find((block) => data[day]?.[block]?.plan || data[day]?.[block]?.act) ?? 4 } : null;
  const scheduled = new Set(displayed.flatMap(({ plan }) => plan?.taskId ? [plan.taskId] : []));
  const unassigned = tasks.data?.filter((task) => !scheduled.has(task.id)) ?? [];
  return (
    <QuerySection className={day ? "life-blocks" : "plan-timetable"} title={day ? 'Life time blocks' : 'Week in timetable · linked to Life'} isPending={life.isPending}
      isError={life.isError} error={life.error} empty={false} onRetry={() => void life.refetch()}>
      <div className={day ? "life-slot-layout" : undefined}>
      <div className="schedule-scroll">
        <table className="schedule-grid">
          <thead><tr><th scope="col">Time</th>{visible.map((day) => <th scope="col" key={day}>{day}</th>)}</tr></thead>
          <tbody>{blocks.map((block) => (
            <tr key={block}>
              <th scope="row">{blockLabel(block)}</th>
              {visible.map((day) => {
                const slot = data[day]?.[block];
                return (
                  <td key={day}><button data-scheduled={Boolean(slot?.plan || slot?.act)} aria-pressed={lifeSelection ? lifeSelection.block === block : undefined} className="shell-button" type="button" aria-label={`${day} ${blockLabel(block)} ${mode}`} onClick={() => setSelection({ day, block })}>
                    {slot?.plan?.title ?? 'Open'}
                    {day === visible[0] && visible.length === 1 && slot?.act && <small>Recorded: {slot.act.title} · {slot.act.status}</small>}
                  </button></td>
                );
              })}
            </tr>
          ))}</tbody>
        </table>
      </div>
      {lifeSelection && <SlotEditor key={`${lifeSelection.day}-${lifeSelection.block}`} week={week} selection={lifeSelection} data={data}
        tasks={tasks.data ?? []} inline mode={mode} onSaved={refresh} onClose={() => setSelection(null)} />}
      </div>
      {!day && (
        <div className="schedule-notes">
          <div><h3>Planned hours</h3>{categories.map((cat) => {
            const hours = displayed.filter(({ plan }) => plan?.cat === cat).length * 2;
            return hours ? <div key={cat}>{cat} · {hours}h</div> : null;
          })}</div>
          <div><h3>Unassigned tasks</h3>{unassigned.length ? unassigned.map(({ id, text }) => <div key={id}>{text}</div>) : <p>No unassigned tasks.</p>}</div>
        </div>
      )}
      {!day && selection && <SlotEditor week={week} selection={selection} data={data} tasks={tasks.data ?? []}
        mode={mode} onSaved={refresh} onClose={() => setSelection(null)} />}
    </QuerySection>
  );
}

function PlanControls({ plan, onChange, busy, section }: {
  plan: WeekPlan; onChange: (patch: Parameters<ReturnType<typeof useApi>['updateWeekPlan']>[1]) => void; busy: boolean; section: 'focus' | 'protection';
}) {
  return (
    <div className="weekly-tasks">
      {section === 'focus' && <form className="task-summary plan-focus" onSubmit={(event) => {
        event.preventDefault();
        onChange({ focus: String(new FormData(event.currentTarget).get('focus') ?? '').trim() });
      }}>
        <input aria-label="Weekly focus" name="focus" defaultValue={plan.focus} maxLength={500} placeholder="One sentence: what should this week be about?" />
        <button className="shell-button" type="submit" disabled={busy}>Save focus</button>
      </form>}
      {section === 'protection' && <div className="plan-protection">
      <p className="query-section-title mono">Protection time · Life</p>
      <div className="registry-filters" role="group" aria-label="Protected time">
        {protectionDays.map((day) => (
          <button type="button" key={day} aria-pressed={Boolean(plan.protect[day])} disabled={busy}
            onClick={() => onChange({ protect: { [day]: !plan.protect[day] } })}>{protections[day]}</button>
        ))}
      </div>
        <button className="screen-primary" type="button" aria-pressed={plan.locked} disabled={busy} onClick={() => onChange({ locked: !plan.locked })}>
          {plan.locked ? 'Unlock plan' : 'Lock plan'}
        </button>
      </div>}
    </div>
  );
}

export function Plan({ week, onAdd }: { week: string; onAdd: () => void }) {
  const api = useApi();
  const client = useQueryClient();
  const [timetable, setTimetable] = useState(false);
  const status = useHomeStatus(week);
  const plan = useQuery({ queryKey: ['week-plan', week], queryFn: () => api.getWeekPlan(week) });
  const update = useMutation({
    mutationFn: (patch: Parameters<typeof api.updateWeekPlan>[1]) => api.updateWeekPlan(week, patch),
    onSuccess: async (next) => {
      client.setQueryData(['week-plan', week], next);
      await client.invalidateQueries({ queryKey: ['life', week] });
    },
  });
  return (
    <section className="handoff-page plan-page">
      <header className="plan-header">
        <div><p className="handoff-eyebrow mono">Plan ahead</p><h1 className="hf">Plan the week</h1></div>
        <div className="plan-view-controls">
          <div className="screen-segment" role="group" aria-label="Plan view">
            <button type="button" aria-pressed={!timetable} onClick={() => setTimetable(false)}>List</button>
            <button type="button" aria-pressed={timetable} onClick={() => setTimetable(true)}>Timetable</button>
          </div>
          <time dateTime={week} className="mono screen-pill">Week of {week}</time>
        </div>
      </header>
      <QuerySection className="plan-focus-panel" title="Focus for the week" isPending={plan.isPending} isError={plan.isError} error={plan.error} empty={false} onRetry={() => void plan.refetch()}>
        {plan.data && <PlanControls plan={plan.data} key={plan.data.focus} section="focus" busy={update.isPending} onChange={(patch) => update.mutate(patch)} />}
        {update.isError && <p role="alert">{update.error.message}</p>}
      </QuerySection>
      {!timetable && <QuerySection className="plan-caps" title="Load per domain · planned / cap" isPending={status.isPending} isError={status.isError} error={status.error}
        empty={!status.data?.domains.length} onRetry={() => void status.refetch()}>
        <div className="domain-folder-list plan-cap-cards">{status.data?.domains.map((item) => (
          <div key={item.domain} data-domain={item.domain}>
            <div className="task-summary"><b>{domains.find(({ id }) => toApiDomainId(id) === item.domain)?.label ?? item.domain}</b><span>{item.total}/{item.cap}</span></div>
            <ProgressBar percent={Math.min(100, item.total * 100 / item.cap)} tone={item.total > item.cap ? 'blocked' : 'done'} />
          </div>
        ))}</div>
      </QuerySection>}
      {timetable ? <Timetable week={week} /> : <WeeklyTasks week={week} onAdd={onAdd} carry />}
      {plan.data && <PlanControls plan={plan.data} section="protection" busy={update.isPending} onChange={(patch) => update.mutate(patch)} />}
    </section>
  );
}

export function LifeSchedule({ week, nextWeek }: { week: string; nextWeek: string }) {
  const [selectedWeek, setSelectedWeek] = useState(week);
  const [day, setDay] = useState<LifeDay>('mon');
  const [mode, setMode] = useState<Mode>('plan');

  return (
    <section aria-label="Life schedule" className="weekly-tasks">
      <div className="registry-filters" role="group" aria-label="Life week">
        {[week, nextWeek].map((value) => <button type="button" aria-pressed={value === selectedWeek} key={value} onClick={() => setSelectedWeek(value)}>{value}</button>)}
      </div>
      <div className="registry-filters" role="group" aria-label="Select day">
        {days.map((value) => <button type="button" aria-pressed={value === day} key={value} onClick={() => setDay(value)}>{value}</button>)}
      </div>
      <div className="registry-filters" role="group" aria-label="Life mode">
        <button type="button" aria-pressed={mode === 'plan'} onClick={() => setMode('plan')}>Plan</button>
        <button type="button" aria-pressed={mode === 'record'} onClick={() => setMode('record')}>Record</button>
      </div>
      <Timetable key={`${selectedWeek}-${day}-${mode}`} week={selectedWeek} day={day} mode={mode} />
    </section>
  );
}
