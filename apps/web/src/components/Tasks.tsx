import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiRequestError, type Task, type TaskInput } from '@productiveme/api-client';
import { toApiDomainId, useApi } from '../lib/api.js';
import { adjacentWeek } from '../lib/week.js';
import { domains } from '../types.js';
import QuerySection from './QuerySection.js';
import { primaryButton } from './bits.js';

function taskError(error: unknown): string {
  return error instanceof Error ? error.message : 'Task request failed.';
}

export function QuickTaskDialog({ week, date, onClose }: { week: string; date?: string; onClose: () => void }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState<TaskInput | null>(null);
  const create = useMutation({
    mutationFn: ({ input, force }: { input: TaskInput; force?: boolean }) => api.createTask(input, force),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
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
    const input: TaskInput = { week, text, domain: toApiDomainId(domain.id), ...(date ? { date } : {}) };
    setPending(input);
    create.mutate({ input });
  };

  return (
    <dialog ref={dialog} className="task-dialog" onCancel={(event) => { event.preventDefault(); onClose(); }} aria-labelledby="quick-task-title">
      <form onSubmit={submit}>
        <h2 className="hf" id="quick-task-title">Add task</h2>
        <label>Task <input name="text" required maxLength={500} /></label>
        <label>Domain <select name="domain">{domains.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}</select></label>
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

type TaskAction = { kind: 'toggle'; task: Task } | { kind: 'delete' | 'restore'; id: string };

export function WeeklyTasks({ week, onAdd, carry = false }: { week: string; onAdd: () => void; carry?: boolean }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [undoId, setUndoId] = useState<string | null>(null);
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
      ]);
    },
  });
  const carryTask = useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) => api.carryTask(id, week, force),
    onSuccess: async () => {
      setCarryId(null);
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
  useEffect(() => {
    if (!undoId) return;
    const timeout = window.setTimeout(() => setUndoId(null), 6500);
    return () => window.clearTimeout(timeout);
  }, [undoId]);

  const data = tasks.data ?? [];
  const complete = data.filter((task) => task.done).length;
  const previousTasks = previous.data?.filter((task) => !task.done) ?? [];
  const carried = (task: Task) => data.some(({ domain, text }) => task.domain === domain && task.text === text);
  const cap = carryTask.error instanceof ApiRequestError && carryTask.error.code === 'CAP_EXCEEDED';

  return (
    <div className="weekly-tasks">
      <QuerySection title="This week's tasks" isPending={tasks.isPending} isError={tasks.isError} error={tasks.error} empty={false} onRetry={() => void tasks.refetch()}>
        <div className="task-summary"><span>{complete} of {data.length} done</span><button type="button" className="shell-button" onClick={onAdd}>+ Add task</button></div>
        <div className="task-board">
          {[false, true].map((done) => (
            <section key={String(done)} aria-label={done ? 'Done' : 'To do'}>
              <h3 className="mono">{done ? 'Done' : 'To do'}</h3>
              <ul>
                {data.filter((task) => task.done === done).map((task) => (
                  <li key={task.id}>
                    <label><input type="checkbox" checked={task.done} disabled={change.isPending} onChange={() => change.mutate({ kind: 'toggle', task })} /> {task.text}</label>
                    <button type="button" className="shell-button" aria-label={`Delete ${task.text}`} disabled={change.isPending} onClick={() => change.mutate({ kind: 'delete', id: task.id })}>Delete</button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        {change.isError && <p role="alert">{taskError(change.error)}</p>}
        {undoId && <p role="status">Task deleted. <button type="button" className="shell-button" disabled={change.isPending} onClick={() => change.mutate({ kind: 'restore', id: undoId })}>Undo</button></p>}
      </QuerySection>
      {carry && (
        <QuerySection title="Carry over" isPending={previous.isPending} isError={previous.isError} error={previous.error} empty={!previousTasks.length} onRetry={() => void previous.refetch()}>
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
