import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { domains, type DomainId } from '../types.js';
import { toApiDomainId, useApi, useDomainSignals, useDomainSnapshots, useDomainStatus, useRegistry } from '../lib/api.js';
import QuerySection from './QuerySection.js';

type DomainsProps = {
  week?: string;
  domainPanel?: ReactNode;
  taskPanel?: ReactNode;
  onHome?: () => void;
  onRegistry?: () => void;
  onRecordAssets?: () => void;
  activeDomain: DomainId;
  onDomainChange: (domain: DomainId) => void;
};

function sourceLink(value?: string): string | undefined {
  if (!value) return;
  const url = URL.parse(value);
  return url?.protocol === 'https:' || url?.protocol === 'http:' ? url.href : undefined;
}

export default function Domains({ activeDomain, onDomainChange, domainPanel, taskPanel, week, onHome, onRegistry, onRecordAssets }: DomainsProps) {
  const api = useApi();
  const client = useQueryClient();
  const complete = useMutation({
    mutationFn: (id: string) => api.updateTask(id, { done: true }),
    onSuccess: async () => {
      await Promise.all(['tasks', 'domain-status', 'home-status'].map((key) => client.invalidateQueries({ queryKey: [key] })));
    },
  });
  const registry = useRegistry();
  const weeklyStatus = useDomainStatus(activeDomain, week);
  const snapshots = useDomainSnapshots(activeDomain);
  const signals = useDomainSignals(activeDomain);
  const apiDomain = toApiDomainId(activeDomain);
  const entries = registry.data?.filter((entry) => entry.domain === apiDomain) ?? [];
  const domainSignals = signals.data ?? [];
  const label = domains.find(({ id }) => id === activeDomain)?.label;
  const byEntry = new Map(snapshots.data?.map((snapshot) => [snapshot.entryId, snapshot]));
  const studyCounts = new Map<string, number>();
  for (const source of entries.filter(({ kind }) => kind === 'notion-page')) {
    const snapshot = byEntry.get(source.id);
    if (snapshot?.status !== 'ok') continue;
    const field = source.subdomain ?? source.name;
    studyCounts.set(field, (studyCounts.get(field) ?? 0) + snapshot.items.length);
  }

  const largestStudyCount = Math.max(1, ...studyCounts.values());
  return (
    <div className="handoff-page domain-page">
      <div className="domain-navigation">
      <nav aria-label="Domains" className="domain-tabs">
        {domains.map((domain) => (
          <button key={domain.id} type="button" aria-pressed={domain.id === activeDomain} onClick={() => onDomainChange(domain.id)}>
            {domain.label}
          </button>
        ))}
      </nav>
      {onHome && <button type="button" className="quiet-link mono" onClick={onHome}>← Home</button>}
      </div>
      <div className="domain-overview">
      {week && <QuerySection className="domain-status-panel" title="This week's status" isPending={weeklyStatus.isPending} isError={weeklyStatus.isError}
        error={weeklyStatus.error} empty={!weeklyStatus.data} onRetry={() => void weeklyStatus.refetch()}>
        {weeklyStatus.data && <>
          <span className="status-chip mono" data-status={weeklyStatus.data.status}>{weeklyStatus.data.status.replace('-', ' ').toUpperCase()}</span>
          <p>{weeklyStatus.data.reason}</p>
          {weeklyStatus.data.next && <div className="domain-next">
            <span className="handoff-eyebrow mono">Next action</span>
            <b className="hf">{weeklyStatus.data.next.text}</b>
            {weeklyStatus.data.next.kind === 'snapshot' && activeDomain === 'finance' && onRecordAssets
              ? <button type="button" className="screen-primary" onClick={onRecordAssets}>Record snapshot</button>
              : <button type="button" className="screen-primary" disabled={complete.isPending} onClick={() => {
                const next = weeklyStatus.data?.next;
                if (next) complete.mutate(next.id);
              }}>Mark done</button>}
          </div>}
          {complete.isError && <p role="alert">Could not complete the task. Try again.</p>}
          <small className="mono">Status considers source health, weekly cap and open tasks.</small>
        </>}
      </QuerySection>}
      {taskPanel}
      </div>
      <QuerySection className="domain-linked" title="Registry sources" isPending={registry.isPending} isError={registry.isError} error={registry.error} empty={!entries.length && !onRegistry} onRetry={() => void registry.refetch()}>
        <ul className="linked-chips">{entries.map((entry) => <li key={entry.id} className="mono">{entry.name}</li>)}</ul>
        {onRegistry && <button type="button" className="quiet-link mono" onClick={onRegistry}>Manage in Registry →</button>}
      </QuerySection>
      <h1 className="hf">{label}</h1>
      {domainPanel}
      {activeDomain === 'career' && !registry.isError && !snapshots.isError &&
        <QuerySection title="Study · writing by field" isPending={registry.isPending || snapshots.isPending}
          isError={false} empty={false}>
          {studyCounts.size ? <ul className="task-carry">
            {[...studyCounts].map(([field, count]) => (
              <li className="study-count" key={field}>
                <span>{field}</span><meter value={count} max={largestStudyCount} aria-label={`${field} collected entries`} />
                <span>{count} collected {count === 1 ? 'entry' : 'entries'}</span>
              </li>
            ))}
          </ul> : <p>No writing data has been collected.</p>}
          <p className="registry-detail">Publishing status is available when a publishing source is connected.</p>
        </QuerySection>}
      {activeDomain === 'pdata' && !registry.isError && !snapshots.isError &&
        <QuerySection title="Folder activity" isPending={registry.isPending || snapshots.isPending}
          isError={false} empty={false}>
          <div className="domain-folder-list folder-cards">
            {entries.filter(({ kind }) => kind === 'folder').map(({ id, name }) => {
              const snapshot = byEntry.get(id);
              const available = snapshot?.status === 'ok';
              return <details key={id}><summary>{name} · {available ? `${snapshot.items.length} ${snapshot.items.length === 1 ? 'entry' : 'entries'}` : 'No current scan'}</summary>
                {available && <ul>{snapshot.items.map((item, index) => <li key={`${item.title}-${index}`}>{item.title}</li>)}</ul>}
                {!available && <p>Run Sync to see folder contents.</p>}
              </details>;
            })}
          </div>
          {!entries.some(({ kind }) => kind === 'folder') && <p>No folders are connected.</p>}
        </QuerySection>}
      <QuerySection title="Latest snapshots" isPending={snapshots.isPending} isError={snapshots.isError} error={snapshots.error} empty={!snapshots.data?.length} onRetry={() => void snapshots.refetch()}>
        <div className="weekly-tasks">
          {snapshots.data?.map((snapshot) => (
            <div key={snapshot.entryId}>
              <b>{entries.find((entry) => entry.id === snapshot.entryId)?.name ?? snapshot.entryId}</b>
              <div className="registry-detail mono">{snapshot.status === 'ok' ? `SYNCED · ${snapshot.fetchedAt}` : snapshot.error ?? 'Source unavailable'}</div>
              {snapshot.items.map((item, index) => {
                const link = sourceLink(item.link);
                return <div key={`${item.title}-${index}`}>{link ? <a href={link}>{item.title}</a> : item.title}{item.detail ? ` · ${item.detail}` : ''}</div>;
              })}
            </div>
          ))}
        </div>
      </QuerySection>
      <QuerySection title="Domain signals" isPending={signals.isPending} isError={signals.isError} error={signals.error} empty={!domainSignals.length} onRetry={() => void signals.refetch()}>
        <ul className="task-carry">{domainSignals.map((signal, index) => (
          <li key={`${signal.entryId ?? index}-${signal.message}`}>
            <div>{signal.message}<div className="registry-detail mono">{signal.severity.toUpperCase()}{signal.suggestedAction ? ` · ${signal.suggestedAction}` : ''}</div></div>
          </li>
        ))}</ul>
      </QuerySection>
    </div>
  );
}
