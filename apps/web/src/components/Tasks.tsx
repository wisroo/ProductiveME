import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiRequestError, type Task, type TaskInput } from '@productiveme/api-client';
import { toApiDomainId, useApi } from '../lib/api.js';
import { adjacentWeek } from '../lib/week.js';
import { domains, type DomainId } from '../types.js';
import QuerySection from './QuerySection.js';
import { primaryButton } from './bits.js';

function taskError(error: unknown): string {
  return error instanceof Error ? error.message : 'Task request failed.';
}

export function QuickTaskDialog({ week, date, domain, onClose }: { week: string; date?: string; domain?: DomainId; onClose: () => void }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState<TaskInput | null>(null);
  const create = useMutation({
    mutationFn: ({ input, force }: { input: TaskInput; force?: boolean }) => api.createTask(input, force),
    onSuccess: async () => {
      await Promise.all(['tasks', 'home-status', 'domain-status'].map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
      onClose();
    },
  });
  useEffect(() => {
    const element = dialog.current;
    const trigger = document.activeElement;
    if (element && !element.open) element.showModal();
    return () => { if (trigger instanceof HTMLElement) trigger.focus(); };
  }, []);

  const exceedsCap = create.error instanceof ApiRequestError && create.error.code === 'CAP_EXCEEDED';
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = String(form.get('text') ?? '').trim();
    const domain = domains.find(({ id }) => id === form.get('domain'));
    if (!text || !domain) return;
    const date = String(form.get('date') ?? '');
    const kind = form.get('kind');
    const input: TaskInput = {
      week, text, domain: toApiDomainId(domain.id), ...(date ? { date } : {}),
      ...(kind === 'snapshot' || kind === 'publish' ? { kind } : {}),
    };
    setPending(input);
    create.mutate({ input });
  };

  return (
    <dialog ref={dialog} className="task-dialog" onCancel={(event) => { event.preventDefault(); onClose(); }} aria-labelledby="quick-task-title">
      <form onSubmit={submit}>
        <div><p className="handoff-eyebrow mono">Add task</p><h2 className="hf" id="quick-task-title">Add task</h2></div>
        <label>Task <input name="text" required maxLength={500} /></label>
        <fieldset className="screen-radio"><legend>Domain</legend>{domains.map(({ id, label }) => (
          <label key={id}><input type="radio" name="domain" value={id} defaultChecked={id === (domain ?? 'career')} /><span>{label}</span></label>
        ))}</fieldset>
        <label>Task type <select name="kind"><option value="">General</option><option value="snapshot">Finance snapshot</option><option value="publish">Publish</option></select></label>
        <label>Date <input type="date" name="date" defaultValue={date} /></label>
        {create.isError && <p role="alert">{taskError(create.error)}</p>}
        <div className="task-actions">
          {exceedsCap && pending && (
            <button type="button" className="shell-button" disabled={create.isPending} onClick={() => create.mutate({ input: pending, force: true })}>
              Add anyway
            </button>
          )}
          <button type="button" className="shell-button" onClick={onClose}>Cancel</button>
          <button type="submit" style={primaryButton} disabled={create.isPending}>Add task</button>
        </div>
      </form>
    </dialog>
  );
}

function TaskDrawer({ task, onClose, onDelete }: { task: Task; onClose: () => void; onDelete: () => void }) {
  const api = useApi();
  const client = useQueryClient();
  const dialog = useRef<HTMLDialogElement>(null);
  const edit = useMutation({
    mutationFn: ({ patch, force }: { patch: Parameters<typeof api.updateTask>[1]; force?: boolean }) =>
      api.updateTask(task.id, patch, force),
    onSuccess: async () => {
      await Promise.all(['tasks', 'home-status', 'domain-status', 'life'].map((key) => client.invalidateQueries({ queryKey: [key] })));
      onClose();
    },
  });
  useEffect(() => {
    const element = dialog.current;
    const trigger = document.activeElement;
    if (element && !element.open) element.showModal();
    return () => { if (trigger instanceof HTMLElement) trigger.focus(); };
  }, []);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = String(data.get('text') ?? '').trim();
    const note = String(data.get('note') ?? '').trim();
    const date = String(data.get('date') ?? '') || null;
    if (text) edit.mutate({ patch: { text, note, date, done: data.has('done') } });
  };
  const move = (force = false) => edit.mutate({ patch: { week: adjacentWeek(task.week, 1) }, force });
  const canForce = edit.error instanceof ApiRequestError && edit.error.code === 'CAP_EXCEEDED';
  return (
    <dialog ref={dialog} className="task-dialog task-drawer" aria-labelledby="task-drawer-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <form onSubmit={submit}>
        <h2 id="task-drawer-title" className="hf">Task details</h2>
        <label>Task <input name="text" defaultValue={task.text} maxLength={500} required /></label>
        <label>Notes <textarea name="note" defaultValue={task.note} maxLength={4000} rows={4} /></label>
        <label>Date <input type="date" name="date" defaultValue={task.date} /></label>
        <label className="task-summary">Done <input type="checkbox" name="done" defaultChecked={task.done} /></label>
        {edit.isError && <p role="alert">{taskError(edit.error)}</p>}
        <div className="task-actions">
          <button type="button" className="shell-button" disabled={edit.isPending} onClick={() => move(canForce)}>
            {canForce ? 'Move anyway' : 'Move to next week'}
          </button>
          <button type="button" className="shell-button" disabled={edit.isPending} onClick={onDelete}>Delete task</button>
        </div>
        <div className="task-actions">
          <button type="button" className="shell-button" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={edit.isPending} style={primaryButton}>Save task</button>
        </div>
      </form>
    </dialog>
  );
}

type TaskAction = { kind: 'toggle'; task: Task } | { kind: 'delete' | 'restore'; id: string };

export function WeeklyTasks({ week, onAdd, carry = false, domain }: { week: string; onAdd: () => void; carry?: boolean; domain?: DomainId }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [undoId, setUndoId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [carryId, setCarryId] = useState<string | null>(null);
  const tasks = useQuery({ queryKey: ['tasks', week], queryFn: () => api.getTasks({ week }) });
  const previousWeek = adjacentWeek(week, -1);
  const previous = useQuery({ queryKey: ['tasks', previousWeek], queryFn: () => api.getTasks({ week: previousWeek }), enabled: carry });
  const change = useMutation({
    mutationFn: async (action: TaskAction) => {
      if (action.kind === 'toggle') await api.updateTask(action.task.id, { done: !action.task.done });
      else if (action.kind === 'delete') await api.deleteTask(action.id);
      else await api.restoreTask(action.id);
    },
    onSuccess: async (_result, action) => {
      if (action.kind === 'delete') setUndoId(action.id);
      if (action.kind === 'restore') setUndoId(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['life'] }),
        queryClient.invalidateQueries({ queryKey: ['home-status'] }),
        queryClient.invalidateQueries({ queryKey: ['domain-status'] }),
      ]);
    },
  });
  const carryTask = useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) => api.carryTask(id, week, force),
    onSuccess: async () => {
      setCarryId(null);
      await Promise.all(['tasks', 'home-status', 'domain-status'].map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
    },
  });
  useEffect(() => {
    if (!undoId) return;
    const timeout = window.setTimeout(() => setUndoId(null), 6500);
    return () => window.clearTimeout(timeout);
  }, [undoId]);

  const data = tasks.data?.filter((task) => !domain || task.domain === toApiDomainId(domain)) ?? [];
  const complete = data.filter((task) => task.done).length;
  const previousTasks = previous.data?.filter((task) => !task.done) ?? [];
  const carried = (task: Task) => data.some(({ domain, text }) => task.domain === domain && task.text === text);
  const cap = carryTask.error instanceof ApiRequestError && carryTask.error.code === 'CAP_EXCEEDED';

  return (
    <div className={`weekly-tasks ${carry ? 'plan-task-grid' : domain ? 'domain-task-list' : 'review-tasks'}`}>
      <QuerySection className="this-week-panel" title={carry ? 'Week in plan' : domain ? 'This week' : "This week's tasks"} isPending={tasks.isPending} isError={tasks.isError} error={tasks.error} empty={false} onRetry={() => void tasks.refetch()}>
        <div className="task-summary"><span>{complete} of {data.length} done</span><button type="button" className="shell-button" onClick={onAdd}>+ Add task</button></div>
        <div className={`task-board ${carry || domain ? 'task-board-flat' : ''}`}>
          {(carry || domain ? [null] : [false, true]).map((done) => (
            <section key={String(done)} aria-label={done === null ? 'Task list' : done ? 'Done' : 'To do'}>
              {done !== null && <h3 className="mono">{done ? 'Done' : 'To do'}</h3>}
              <ul>
                {data.filter((task) => done === null || task.done === done).map((task) => (
                  <li key={task.id}>
                    <input type="checkbox" checked={task.done} disabled={change.isPending}
                      aria-label={`Mark ${task.done ? 'open' : 'done'}: ${task.text}`} onChange={() => change.mutate({ kind: 'toggle', task })} />
                    <button type="button" className="source-name" onClick={() => setSelectedTask(task)}>{task.text}</button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        {change.isError && <p role="alert">{taskError(change.error)}</p>}
        {undoId && <p role="status">Task deleted. <button type="button" className="shell-button" disabled={change.isPending} onClick={() => change.mutate({ kind: 'restore', id: undoId })}>Undo</button></p>}
      </QuerySection>
      {selectedTask && <TaskDrawer task={selectedTask} onClose={() => setSelectedTask(null)} onDelete={() => {
        change.mutate({ kind: 'delete', id: selectedTask.id });
        setSelectedTask(null);
      }} />}
      {carry && (
        <QuerySection className="carry-panel" title="Carry over" isPending={previous.isPending} isError={previous.isError} error={previous.error} empty={!previousTasks.length} onRetry={() => void previous.refetch()}>
          <ul className="task-carry">
            {previousTasks.map((task) => (
              <li key={task.id}>
                <span>{task.text}</span>
                <button type="button" className="shell-button" disabled={carried(task) || carryTask.isPending} onClick={() => {
                  setCarryId(task.id);
                  carryTask.mutate({ id: task.id });
                }}>{carried(task) ? 'Carried ✓' : 'Carry'}</button>
              </li>
            ))}
          </ul>
          {carryTask.isError && <p role="alert">{taskError(carryTask.error)}{' '}
            {cap && carryId && <button type="button" className="shell-button" onClick={() => carryTask.mutate({ id: carryId, force: true })}>Carry anyway</button>}
          </p>}
        </QuerySection>
      )}
    </div>
  );
}
