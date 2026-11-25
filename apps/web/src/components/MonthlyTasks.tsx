import { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import type { Task } from '@productiveme/api-client';
import { toApiDomainId, useApi } from '../lib/api.js';
import { shiftDate, weekOfDate } from '../lib/week.js';
import QuerySection from './QuerySection.js';
import { ProgressBar } from './bits.js';
import { domains } from '../types.js';

const dateLabel = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });

export default function MonthlyTasks({ today, onAdd }: { today: string; onAdd: (date: string) => void }) {
  const api = useApi();
  const month = today.slice(0, 7);
  const first = `${month}-01`;
  const monthEnd = new Date(`${first}T00:00:00Z`);
  monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1, 0);
  const dayCount = monthEnd.getUTCDate();
  const final = monthEnd.toISOString().slice(0, 10);
  const [selected, setSelected] = useState(today);
  const weeks: string[] = [];
  for (let week = weekOfDate(first); week <= final; week = shiftDate(week, 7)) weeks.push(week);
  const results = useQueries({
    queries: weeks.map((week) => ({ queryKey: ['tasks', week], queryFn: () => api.getTasks({ week }) })),
  });
  const byDay = new Map<string, Task[]>();
  results.forEach(({ data }, index) => {
    let undated = 0;
    for (const task of data ?? []) {
      const assigned = task.date ?? shiftDate(weeks[index] ?? first, undated++ % 5);
      if (assigned < first || assigned > final) continue;
      const display = task.done && assigned > today ? today : assigned;
      const tasks = byDay.get(display) ?? [];
      tasks.push(task);
      byDay.set(display, tasks);
    }
  });
  const firstColumn = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7;
  const monthlyTasks = [...byDay.values()].flat();
  const complete = monthlyTasks.filter((task) => task.done).length;
  const summaries = domains.map(({ id, label }) => {
    const tasks = monthlyTasks.filter(({ domain }) => domain === toApiDomainId(id));
    return { id, label, total: tasks.length, done: tasks.filter((task) => task.done).length };
  });
  const failure = results.find((result) => result.isError);
  return (
    <QuerySection className="monthly-review-panel" title="Monthly tasks" isPending={results.some((result) => result.isPending)}
      isError={Boolean(failure)} error={failure?.error ?? null} empty={false}
      onRetry={() => { for (const result of results) if (result.isError) void result.refetch(); }}>
      <div className="monthly-task-grid">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day} className="mono">{day}</span>)}
        {Array.from({ length: firstColumn }, (_, index) => <span key={`empty-${index}`} aria-hidden="true" />)}
        {Array.from({ length: dayCount }, (_, index) => {
          const date = shiftDate(first, index);
          const items = byDay.get(date) ?? [];
          const done = items.filter((item) => item.done).length;
          const open = items.length - done;
          return (
            <button type="button" key={date} className="shell-button"
              aria-label={`${dateLabel.format(new Date(`${date}T00:00:00Z`))}: ${done} done, ${open} open`}
              aria-pressed={date === selected} onClick={() => setSelected(date)}>
              <span>{index + 1}</span><span>{items.length > 0 ? `✓${done} ○${open}` : ''}</span>
            </button>
          );
        })}
      </div>
      <div className="task-summary">
        <h3>{dateLabel.format(new Date(`${selected}T00:00:00Z`))}</h3>
        <button type="button" className="shell-button" onClick={() => onAdd(selected)}>+ Add task</button>
      </div>
      <ul className="task-carry">
        {(byDay.get(selected) ?? []).map((task) => <li key={task.id}>{task.done ? '✓ ' : '○ '}{task.text}</li>)}
      </ul>
      {!byDay.get(selected)?.length && <p>No tasks for this day.</p>}
      <div className="monthly-metrics">
        <div><small className="mono">Done</small><b className="hf">{complete}</b></div>
        <div><small className="mono">Open</small><b className="hf">{monthlyTasks.length - complete}</b></div>
        <div><small className="mono">Completion</small><b className="hf">{monthlyTasks.length ? Math.round(complete / monthlyTasks.length * 100) : 0}%</b></div>
      </div>
      <h3 className="query-section-title mono">Week by week</h3>
      <ul className="finance-detail-list">{weeks.map((week) => {
        const items = [...byDay].filter(([date]) => weekOfDate(date) === week).flatMap(([, items]) => items);
        const done = items.filter((task) => task.done).length;
        return <li key={week}>
          <div className="task-summary"><time dateTime={week}>Week of {week}</time><span>{done}/{items.length} done</span></div>
          <ProgressBar percent={items.length ? done * 100 / items.length : 0} tone="accent" />
        </li>;
      })}</ul>
      <h3 className="query-section-title mono">Domains · This month</h3>
      <ul className="finance-detail-list">{summaries.map(({ id, label, total, done }) => (
        <li key={id}><div className="task-summary"><b>{label}</b><span>{done}/{total} done</span></div>
          <ProgressBar percent={total ? done / total * 100 : 0} tone="done" />
        </li>
      ))}</ul>
    </QuerySection>
  );
}
