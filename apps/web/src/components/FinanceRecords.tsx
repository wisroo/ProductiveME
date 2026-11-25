import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FinanceInput } from '@productiveme/api-client';
import { useApi } from '../lib/api.js';
import { localDate } from '../lib/week.js';
import QuerySection from './QuerySection.js';
import { primaryButton, ProgressBar } from './bits.js';

const fields = [
  ['investments', 'Investments', 'accent'], ['cash', 'Cash', 'done'], ['savings', 'Savings', 'parked'], ['other', 'Other assets', 'due'],
] as const;
const currency = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' });

export function FinanceDialog({ week, onClose }: { week: string; onClose: () => void }) {
  const api = useApi();
  const client = useQueryClient();
  const dialog = useRef<HTMLDialogElement>(null);
  const [total, setTotal] = useState(0);
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
      <form onSubmit={submit} onChange={(event) => {
        const data = new FormData(event.currentTarget);
        setTotal(fields.reduce((sum, [key]) => sum + (Number(data.get(key)) || 0), 0));
      }}>
<div><p className="handoff-eyebrow mono">Record</p><h2 className="hf" id="finance-dialog-title">Asset snapshot</h2></div>
        <label>Date <input name="date" type="date" defaultValue={localDate()} required /></label>
        <div className="finance-amounts">{fields.map(([key, label]) => <label key={key}>{label} (KRW)
          <input name={key} type="number" min="0" max="1000000000000" step="1" defaultValue="0" required />
        </label>)}</div>
        <output className="hf" aria-label="Total assets">{currency.format(total)}</output>
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

function FinanceDetail({ title, drawer, onClose, children }: {
  title: string; drawer: boolean; onClose: () => void; children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const trigger = document.activeElement;
    if (ref.current && !ref.current.open) ref.current.showModal();
    return () => { if (trigger instanceof HTMLElement) trigger.focus(); };
  }, []);
  return <dialog ref={ref} className={`task-dialog finance-detail ${drawer ? 'task-drawer' : ''}`}
    aria-labelledby="finance-detail-title" onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <header className="task-summary">
      <div><p className="handoff-eyebrow mono">Finance</p><h2 id="finance-detail-title" className="hf">{title}</h2></div>
      <button type="button" className="quiet-link" aria-label="Close finance detail" onClick={onClose}>×</button>
    </header>
    {children}
  </dialog>;
}

export default function FinanceRecords({ week }: { week: string }) {
  const api = useApi();
  const data = useQuery({ queryKey: ['finance-snapshots'], queryFn: () => api.getFinanceSnapshots() });
  const [recording, setRecording] = useState(false);
  const [details, setDetails] = useState<'history' | 'assets' | 'spending' | null>(null);
  const latest = data.data?.[0];
  const thisMonth = latest?.date.startsWith(localDate().slice(0, 7));
  let cumulative = 0;
  const values = fields.map(([key, label, tone]) => {
    const amount = latest?.[key] ?? 0;
    const percent = latest?.total ? amount / latest.total * 100 : 0;
    const start = cumulative;
    cumulative += percent;
    return { key, label, tone, amount, percent, start, end: cumulative };
  });
  const chart = latest?.total ? `conic-gradient(${values.map(({ tone, start, end }) => `var(--${tone}) ${start}% ${end}%`).join(', ')})` : 'var(--track)';
  const history = data.data ?? [];
  const max = Math.max(1, ...history.map((item) => item.total));
  return (
    <section className="weekly-tasks finance-records" aria-label="Finance records">
      <div className="task-summary">
        <p className="query-section-title mono">Finance snapshots</p>
        <button type="button" className="shell-button" onClick={() => setRecording(true)}>Record snapshot</button>
      </div>
      <QuerySection className="finance-overview" title="Asset snapshots" hideTitle isPending={data.isPending} isError={data.isError} error={data.error} empty={false} onRetry={() => void data.refetch()}>
        <div className="finance-history-preview">
          {history.slice(0, 3).reverse().map((item) => <button type="button" key={item.id} onClick={() => setDetails('history')}>
            <time className="mono" dateTime={item.date}>Snapshot · {item.date}</time><b className="hf">{currency.format(item.total)}</b>
          </button>)}
          {!latest && <p>No asset snapshot recorded yet.</p>}
        </div>
        <div className="finance-stat-grid">
          <button type="button" onClick={() => setDetails('history')}><small className="mono">Net worth</small><b className="hf">{latest ? currency.format(latest.total) : '—'}</b></button>
          <div><small className="mono">Cash</small><b className="hf">{latest ? currency.format(latest.cash) : '—'}</b></div>
          <button type="button" onClick={() => setDetails('spending')}><small className="mono">Spending</small><b className="hf">—</b></button>
          <div data-missing={!thisMonth}><small className="mono">Snapshot status</small><b className="hf">{thisMonth ? 'Recorded' : 'Missing'}</b>{latest && <small>{latest.date}</small>}</div>
        </div>
        <div className="finance-breakdowns">
          <section className="query-section">
            <div className="task-summary"><h3 className="query-section-title mono">Spending by category</h3><button type="button" className="quiet-link mono" onClick={() => setDetails('spending')}>Details →</button></div>
            <p>Connect a spending source to see a category breakdown.</p>
          </section>
          <section className="query-section">
            <div className="task-summary"><h3 className="query-section-title mono">Asset composition</h3><button type="button" className="quiet-link mono" onClick={() => setDetails('assets')}>Details →</button></div>
            {latest ? <div className="finance-composition">
              <div className="finance-donut" aria-hidden="true" style={{ background: chart }}><span>{currency.format(latest.total)}</span></div>
              <ul className="finance-legend mono">{values.map(({ key, label, tone, percent }) =>
                <li data-tone={tone} key={key}><span />{label} {Math.round(percent)}%</li>)}</ul>
            </div> : <p>Record a snapshot to see how your assets are divided.</p>}
          </section>
        </div>
      </QuerySection>
      {recording && <FinanceDialog week={week} onClose={() => setRecording(false)} />}
      {details && <FinanceDetail title={details === 'history' ? 'Net worth by snapshot' : details === 'assets' ? 'Asset composition' : 'Spending by category'}
        drawer={details !== 'history'} onClose={() => setDetails(null)}>
        {details === 'history' && (history.length ? <ul className="finance-detail-list">{history.map((item) => <li key={item.id}>
          <div className="task-summary"><time dateTime={item.date}>{item.date}</time><b>{currency.format(item.total)}</b></div>
          <ProgressBar percent={item.total / max * 100} tone="done" />
        </li>)}</ul> : <p>No asset snapshot recorded yet.</p>)}
        {details === 'assets' && (latest ? <ul className="finance-detail-list">{values.map(({ key, label, tone, amount, percent }) => <li key={key}>
          <div className="task-summary"><b>{label}</b><span>{Math.round(percent)}% · {currency.format(amount)}</span></div>
          <ProgressBar percent={percent} tone={tone} />
        </li>)}</ul> : <p>No asset composition recorded yet.</p>)}
        {details === 'spending' && <p>Connect a spending source to see a category breakdown.</p>}
      </FinanceDetail>}
    </section>
  );
}
