import { useState } from 'react';
import { toApiDomainId, useRegistry, useSnapshots } from '../lib/api.js';
import { domains, type DomainId } from '../types.js';
import QuerySection from './QuerySection.js';

const syncedDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' });

export default function Registry() {
  const registry = useRegistry();
  const snapshots = useSnapshots();
  const [filter, setFilter] = useState<DomainId | 'all'>('all');
  const sources = registry.data ?? [];
  const visible = filter === 'all' ? sources : sources.filter((source) => source.domain === toApiDomainId(filter));
  const bySource = new Map(snapshots.data?.map((snapshot) => [snapshot.entryId, snapshot]));

  return (
    <div className="handoff-page registry-page">
      <div className="registry-header">
        <div>
          <p className="handoff-eyebrow mono">Registry</p>
          <h1 className="hf">Connected sources</h1>
        </div>
        {registry.isSuccess && <span className="mono">{sources.length} {sources.length === 1 ? 'source' : 'sources'}</span>}
      </div>
      {sources.length > 0 && (
        <div className="registry-filters" role="group" aria-label="Filter by domain">
          <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>All {sources.length}</button>
          {domains.map(({ id, label }) => (
            <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>
              {label} {sources.filter((source) => source.domain === toApiDomainId(id)).length}
            </button>
          ))}
        </div>
      )}
      <QuerySection title="Source list" isPending={registry.isPending} isError={registry.isError} error={registry.error} empty={false} onRetry={() => void registry.refetch()}>
        {snapshots.isError && sources.length > 0 && (
          <div role="alert" className="registry-status-error">
            Could not load source sync status.{' '}
            <button type="button" className="shell-button" onClick={() => void snapshots.refetch()}>Retry status</button>
          </div>
        )}
        {visible.length ? (
          <ul className="registry-list">
            {visible.map((source) => {
              const snapshot = bySource.get(source.id);
              const synced = snapshot?.status === 'ok' && !snapshots.isError;
              const unavailable = !snapshots.isError && snapshot?.status === 'error' && snapshot.error !== 'No snapshots found';
              const status = snapshots.isError ? 'Unknown' : snapshots.isPending ? 'Checking status…' : synced ? 'Synced' : unavailable ? 'Unavailable' : 'No snapshot yet';
              return (
                <li key={source.id} className="registry-row">
                  <div>
                    <b>{source.name}</b>
                    <div className="registry-detail mono">{source.kind} · {source.connector}</div>
                  </div>
                  <span className="registry-chip mono">
                    {domains.find(({ id }) => toApiDomainId(id) === source.domain)?.label ?? source.domain}
                  </span>
                  <span className="registry-sync mono" data-state={synced ? 'synced' : unavailable ? 'unavailable' : undefined}>
                    <span aria-hidden="true">● </span>{status}
                    {synced && <> · <time dateTime={snapshot.fetchedAt}>{syncedDate.format(new Date(snapshot.fetchedAt))}</time></>}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : <p>{filter === 'all' ? 'No connected sources yet.' : 'No sources in this domain.'}</p>}
      </QuerySection>
      <p className="registry-detail mono">ProductiveME reads source data. The original data stays in each source.</p>
    </div>
  );
}
