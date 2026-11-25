import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FinanceInput } from '@productiveme/api-client';
import { useApi } from '../lib/api.js';
import { localDate } from '../lib/week.js';
import QuerySection from './QuerySection.js';
import { primaryButton } from './bits.js';

const fields = [
  ['cash', 'Cash'], ['savings', 'Savings'], ['investments', 'Investments'], ['other', 'Other assets'],
] as const;
const currency = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' });

function FinanceDialog({ week, onClose }: { week: string; onClose: () => void }) {
  const api = useApi();
  const client = useQueryClient();
  const dialog = useRef<HTMLDialogElement>(null);
  const candidates = useQuery({ queryKey: ['tasks', week], queryFn: () => api.getTasks({ week }) });
  const choices = candidates.data?.filter(({ domain, kind, done }) => domain === 'finance' && kind === 'snapshot' && !done) ?? [];
  const save = useMutation({
    mutationFn: (input: FinanceInput) => api.recordFinance(input),
    onSuccess: async () => {
      await Promise.all(['finance-snapshots', 'tasks', 'home-status', 'domain-status'].map((key) => client.invalidateQueries({ queryKey: [key] })));
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
    const date = String(data.get('date') ?? '');
    const taskId = String(data.get('task') ?? '');
    save.mutate({
      week, date, cash: Number(data.get('cash')), savings: Number(data.get('savings')),
      investments: Number(data.get('investments')), other: Number(data.get('other')),
      ...(taskId ? { taskId } : {}),
    });
  };

  return (
    <dialog ref={dialog} className="task-dialog" aria-labelledby="finance-dialog-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <form onSubmit={submit}>
        <h2 className="hf" id="finance-dialog-title">Record assets</h2>
        <label>Date <input name="date" type="date" defaultValue={localDate()} required /></label>
        {fields.map(([key, label]) => <label key={key}>{label} (KRW)
          <input name={key} type="number" min="0" max="1000000000000" step="1" defaultValue="0" required />
        </label>)}
        {choices.length > 1 && <label>Complete snapshot task
          <select name="task" required><option value="">Select a task</option>{choices.map(({ id, text }) => <option key={id} value={id}>{text}</option>)}</select>
        </label>}
        {save.isError && <p role="alert">{save.error.message}</p>}
        <div className="task-actions">
          <button type="button" className="shell-button" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={save.isPending} style={primaryButton}>Save snapshot</button>
        </div>
      </form>
    </dialog>
  );
}

export default function FinanceRecords({ week }: { week: string }) {
  const api = useApi();
  const data = useQuery({ queryKey: ['finance-snapshots'], queryFn: () => api.getFinanceSnapshots() });
  const [recording, setRecording] = useState(false);
  const latest = data.data?.[0];
  const thisMonth = latest?.date.startsWith(localDate().slice(0, 7));
  return (
    <section className="weekly-tasks" aria-label="Finance records">
      <div className="task-summary"><h1 className="hf">Finance</h1><button type="button" style={primaryButton} onClick={() => setRecording(true)}>Record snapshot</button></div>
      <QuerySection title="Asset snapshots" isPending={data.isPending} isError={data.isError} error={data.error} empty={false} onRetry={() => void data.refetch()}>
        <p>{thisMonth ? 'Recorded this month.' : latest ? `Missing this month · last ${latest.date}` : 'No asset snapshot recorded yet.'}</p>
        {latest && <>
          <h3>Latest assets · {currency.format(latest.total)}</h3>
          {fields.map(([key, label]) => (
            <div key={key} className="task-summary"><span>{label}</span><span>{currency.format(latest[key])}</span></div>
          ))}
          <details>
            <summary>Snapshot history</summary>
            <ul className="task-carry">{data.data?.map((item) => <li key={item.id}><time dateTime={item.date}>{item.date}</time><b>{currency.format(item.total)}</b></li>)}</ul>
          </details>
        </>}
      </QuerySection>
      <QuerySection title="Spending" isPending={false} isError={false} empty={false} onRetry={() => undefined}>
        <p>Connect a spending source to see a category breakdown.</p>
      </QuerySection>
      {recording && <FinanceDialog week={week} onClose={() => setRecording(false)} />}
    </section>
  );
}
