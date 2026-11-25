import type { ReactNode } from 'react';
import { domains, type DomainId } from '../types.js';
import { toApiDomainId, useDomainSignals, useDomainSnapshots, useDomainStatus, useRegistry } from '../lib/api.js';
import QuerySection from './QuerySection.js';

type DomainsProps = {
  week?: string;
  domainPanel?: ReactNode;
  taskPanel?: ReactNode;
  activeDomain: DomainId;
  onDomainChange: (domain: DomainId) => void;
};

function sourceLink(value?: string): string | undefined {
  if (!value) return;
  const url = URL.parse(value);
  return url?.protocol === 'https:' || url?.protocol === 'http:' ? url.href : undefined;
}

export default function Domains({ activeDomain, onDomainChange, domainPanel, taskPanel, week }: DomainsProps) {
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

  return (
    <div className="handoff-page weekly-tasks">
      <nav aria-label="Domains" className="registry-filters">
        {domains.map((domain) => (
          <button key={domain.id} type="button" aria-pressed={domain.id === activeDomain} onClick={() => onDomainChange(domain.id)}>
            {domain.label}
          </button>
        ))}
      </nav>
      <h1 className="hf">{label}</h1>
      {week && <QuerySection title="This week's status" isPending={weeklyStatus.isPending} isError={weeklyStatus.isError}
        error={weeklyStatus.error} empty={!weeklyStatus.data} onRetry={() => void weeklyStatus.refetch()}>
        {weeklyStatus.data && <>
          <b>{weeklyStatus.data.status.replace('-', ' ').toUpperCase()}</b>
          <p>{weeklyStatus.data.reason}</p>
          {weeklyStatus.data.next && <p>Next action · {weeklyStatus.data.next.text}</p>}
          <p className="mono">Source down → cap exceeded → none done → more tasks open than done.</p>
        </>}
      </QuerySection>}
      {taskPanel}
      <QuerySection title="Registry sources" isPending={registry.isPending} isError={registry.isError} error={registry.error} empty={!entries.length} onRetry={() => void registry.refetch()}>
        <ul className="task-carry">{entries.map((entry) => (
          <li key={entry.id}><b>{entry.name}</b><span className="registry-detail mono">{entry.kind} · {entry.connector}</span></li>
        ))}</ul>
      </QuerySection>
      {activeDomain === 'career' && !registry.isError && !snapshots.isError &&
        <QuerySection title="Study · writing by field" isPending={registry.isPending || snapshots.isPending}
          isError={false} empty={false}>
          {studyCounts.size ? <ul className="task-carry">
            {[...studyCounts].map(([field, count]) => <li key={field}><span>{field}</span><span>{count} collected {count === 1 ? 'entry' : 'entries'}</span></li>)}
          </ul> : <p>No writing data has been collected.</p>}
          <p className="registry-detail">Publishing status is available when a publishing source is connected.</p>
        </QuerySection>}
      {activeDomain === 'pdata' && !registry.isError && !snapshots.isError &&
        <QuerySection title="Folder activity" isPending={registry.isPending || snapshots.isPending}
          isError={false} empty={false}>
          <div className="domain-folder-list">
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
      {domainPanel}
    </div>
  );
}
