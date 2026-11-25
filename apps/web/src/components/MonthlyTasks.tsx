import { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import type { Task } from '@productiveme/api-client';
import { useApi } from '../lib/api.js';
import { shiftDate, weekOfDate } from '../lib/week.js';
import QuerySection from './QuerySection.js';

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
  const failure = results.find((result) => result.isError);
  return (
    <QuerySection title="Monthly tasks" isPending={results.some((result) => result.isPending)}
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
    </QuerySection>
  );
}
