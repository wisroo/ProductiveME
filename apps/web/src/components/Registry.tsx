import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { RegistrySource } from '@productiveme/api-client';
import { useState } from 'react';
import { toApiDomainId, useApi, useRegistry, useSourceHealth } from '../lib/api.js';
import { domains, type DomainId } from '../types.js';
import SourceDialog from './SourceDialog.js';
import { primaryButton } from './bits.js';
import QuerySection from './QuerySection.js';

const syncedDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' });

export default function Registry() {
  const api = useApi();
  const queryClient = useQueryClient();
  const retry = useMutation({
    mutationFn: (id: string) => api.retrySource(id),
    onSuccess: async () => {
      await Promise.all(['source-health', 'snapshots', 'domains', 'signals', 'home-status', 'domain-status'].map((key) =>
        queryClient.invalidateQueries({ queryKey: [key] }),
      ));
    },
  });
  const registry = useRegistry();
  const health = useSourceHealth();
  const [filter, setFilter] = useState<DomainId | 'all' | 'down' | 'tools'>('all');
  const [editor, setEditor] = useState<{ source?: RegistrySource; remove?: boolean } | null>(null);
  const sources = registry.data ?? [];
  const bySource = new Map(health.data?.map((state) => [state.id, state]));
  const toolbox = sources.filter(({ domain }) => domain === 'tools');
  const down = sources.filter(({ id }) => bySource.get(id)?.status === 'down');
  const visible = filter === 'all' ? sources : filter === 'down' ? down : filter === 'tools' ? toolbox : sources.filter((source) => source.domain === toApiDomainId(filter));

  return (
    <div className="handoff-page registry-page">
      <div className="registry-header">
        <div>
          <p className="handoff-eyebrow mono">Registry</p>
          <h1 className="hf">Connected sources</h1>
        </div>
        <div className="task-actions">
          {registry.isSuccess && <span className="mono">{sources.length} {sources.length === 1 ? 'source' : 'sources'}</span>}
          <button type="button" onClick={() => setEditor({})} style={primaryButton}>+ Register source</button>
        </div>
      </div>
      {sources.length > 0 && (
        <div className="registry-filters" role="group" aria-label="Filter by domain">
          <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>All {sources.length}</button>
          {domains.map(({ id, label }) => (
            <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>
              {label} {sources.filter((source) => source.domain === toApiDomainId(id)).length}
            </button>
          ))}
          <button type="button" aria-pressed={filter === 'tools'} onClick={() => setFilter('tools')}>Toolbox {toolbox.length}</button>
          {health.isSuccess && <button type="button" aria-pressed={filter === 'down'} onClick={() => setFilter('down')}>Down {down.length}</button>}
        </div>
      )}
      <QuerySection title="Source list" isPending={registry.isPending} isError={registry.isError} error={registry.error} empty={false} onRetry={() => void registry.refetch()}>
        {health.isError && sources.length > 0 && (
          <div role="alert" className="registry-status-error">
            Could not load source sync status.{' '}
            <button type="button" className="shell-button" onClick={() => void health.refetch()}>Retry status</button>
          </div>
        )}
        {visible.length ? (
          <ul className="registry-list">
            {visible.map((source) => {
              const state = health.isError ? undefined : bySource.get(source.id);
              const status = source.connector === 'link' ? 'Link only' : health.isPending ? 'Checking status…' : state?.status === 'live'
                ? 'Synced' : state?.status === 'down' ? 'Unavailable' : state?.status === 'idle' ? 'No snapshot yet' : 'Unknown';
              const lastGood = state?.lastGoodReadAt;
              return (
                <li key={source.id} className="registry-row">
                  <div>
                    <button type="button" className="source-name" onClick={() => setEditor({ source })}>{source.name}</button>
                    <div className="registry-detail mono">{source.kind} · {source.connector}
                      {source.connector === 'link' && URL.parse(source.locator)?.protocol === 'https:' && (
                        <> · <a href={source.locator} rel="noreferrer" target="_blank">Open ↗</a></>
                      )}
                    </div>
                  </div>
                  <span className="registry-chip mono">
                    {domains.find(({ id }) => toApiDomainId(id) === source.domain)?.label ?? (source.domain === 'tools' ? 'Toolbox' : source.domain)}
                  </span>
                  <span className="registry-sync mono" data-state={state?.status === 'live' ? 'synced' : state?.status === 'down' ? 'unavailable' : undefined}>
                    <span aria-hidden="true">● </span>{status}
                    {lastGood && <>
                      {' · '}{state?.status === 'down' ? 'Last good read ' : ''}
                      <time dateTime={lastGood}>{syncedDate.format(new Date(lastGood))}</time>
                    </>}
                    {state?.canRetry && state.status !== 'live' && (
                      <button type="button" className="shell-button registry-retry"
                        aria-label={`Retry ${source.name}`} disabled={retry.isPending} onClick={() => retry.mutate(source.id)}>
                        {retry.isPending && retry.variables === source.id ? 'Retrying…' : 'Retry'}
                      </button>
                    )}
                    <button type="button" className="shell-button registry-retry" aria-label={`Remove ${source.name}`} onClick={() => setEditor({ source, remove: true })}>×</button>
                    {retry.variables === source.id && (retry.isError || retry.data?.status === 'down') && (
                      <span role="status" className="registry-retry-result">
                        {retry.isError ? 'Could not run source retry.' : 'Source is still unavailable.'}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : <p>{filter === 'all' ? 'No connected sources yet.' : filter === 'down' ? 'No sources are down.' : 'No sources in this domain.'}</p>}
      </QuerySection>
      {editor && <SourceDialog {...editor} onClose={() => setEditor(null)} sourceCount={sources.length} />}
      <p className="registry-detail mono">ProductiveME reads source data. The original data stays in each source.</p>
    </div>
  );
}
