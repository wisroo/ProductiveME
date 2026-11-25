import { domains, type DomainId } from '../types.js';
import { useDomainRollups, useHomeStatus, useSignals, useSnapshots, toApiDomainId } from '../lib/api.js';
import { eyebrow, fill, primaryButton, ProgressBar } from './bits.js';
import QuerySection from './QuerySection.js';

type HomeProps = {
  week?: string;
  onDomainSelect: (domain: DomainId) => void;
  onOpenDomains: () => void;
  onRecordAssets?: () => void;
  onOpenRegistry: () => void;
  onStartReview: () => void;
};

const healthLabel: Record<string, string> = {
  healthy: 'HEALTHY',
  degraded: 'DEGRADED',
  unavailable: 'UNAVAILABLE',
};

export default function Home({
  week,
  onDomainSelect,
  onOpenDomains,
  onRecordAssets,
  onOpenRegistry,
  onStartReview,
}: HomeProps) {
  const rollups = useDomainRollups();
  const signals = useSignals();
  const snapshots = useSnapshots();
  const weekly = useHomeStatus(week);
  const sourceAlert = weekly.data?.sourceAlerts[0];
  const hasSourceError = snapshots.isSuccess && snapshots.data.some(
    (snapshot) => snapshot.status === 'error' && snapshot.error !== 'No snapshots found',
  );
  const noSources = rollups.isSuccess && rollups.data.every((rollup) => rollup.entryCount === 0);
  const activity = (snapshots.data ?? [])
    .filter((snapshot) => snapshot.status === 'ok')
    .flatMap((snapshot) => snapshot.items)
    .flatMap((item) => {
      const timestamp = item.timestamp;
      return timestamp && Number.isFinite(Date.parse(timestamp)) ? [{ ...item, timestamp }] : [];
    })
    .sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp))
    .slice(0, 6);
  const pendingSources = new Set(snapshots.data?.filter(
    (snapshot) => snapshot.status === 'error' && snapshot.error === 'No snapshots found',
  ).map((snapshot) => snapshot.entryId));
  const issues = (signals.data ?? []).filter((signal) =>
    signal.severity !== 'blocked' || !signal.entryId || !pendingSources.has(signal.entryId),
  );
  const actions = issues.filter((signal) => signal.suggestedAction?.trim());
  const financeTask = weekly.data?.domains.find((status) => status.domain === 'finance')?.next;
  const financeAction = onRecordAssets && (financeTask?.kind === 'snapshot' || actions[0]?.domain === 'finance');
  const cardTones = { career: 'done', finance: 'due', pdata: 'parked', life: 'blocked' } as const;

  return (
    <div className="handoff-page handoff-home">
      {(sourceAlert || hasSourceError) && (
        <div className="home-source-banner" role="status">
          <div>
            <b className="mono">Source down{sourceAlert ? ` · ${sourceAlert.name}` : ''}</b>
            <p>{sourceAlert ? `${sourceAlert.name} is unavailable.` : 'Some source data is unavailable.'}
              {sourceAlert?.lastGoodReadAt && <> Last good read <time dateTime={sourceAlert.lastGoodReadAt}>{new Date(sourceAlert.lastGoodReadAt).toLocaleString()}</time>.</>}
              {' Data may be stale.'}
            </p>
          </div>
          <button type="button" className="home-banner-action" onClick={onOpenRegistry}>View sources</button>
        </div>
      )}
      <div>
        <div
          className="mono"
          style={{ fontSize: '10px', letterSpacing: '.16em', color: 'var(--accent)' }}
        >
          WHERE AM I · WHAT CHANGED · WHAT’S NEXT
        </div>
        <h1 className="handoff-title hf">{financeTask?.kind === 'snapshot' ? `This week, start with ${financeTask.text}.` : 'Where should your attention go?'}</h1>
      </div>

      {noSources && (
        <section className="home-empty">
          <p>No sources are configured.</p>
          <button type="button" className="shell-button" onClick={onOpenRegistry}>View Registry →</button>
        </section>
      )}
      <QuerySection
        title="Domain progress"
        className="home-domain-section"
        hideTitle
        isPending={rollups.isPending}
        isError={rollups.isError}
        error={rollups.error}
        empty={false}
        onRetry={() => void rollups.refetch()}
      >
        <div className="home-domain-grid">
          {domains.map((domain) => {
            const rollup = rollups.data?.find(
              (item) => item.domain === toApiDomainId(domain.id),
            );

            const status = weekly.data?.domains.find((item) => item.domain === toApiDomainId(domain.id));
            const tone = status
              ? status.status === 'on-track' ? 'done' : status.status === 'attention' ? 'due' : 'blocked'
              : rollup?.health === 'healthy' ? 'done' : rollup?.health === 'degraded' ? 'due' : 'parked';
            const progress = rollup?.entryCount ? Math.round(100 * rollup.okCount / rollup.entryCount) : null;
            return (
              <button
                key={domain.id}
                type="button"
                className="domain-card home-domain-card"
                data-tone={cardTones[domain.id]}
                aria-label={domain.label}
                onClick={() => onDomainSelect(domain.id)}
              >
                <div className="home-card-heading">
                  <b style={{ fontSize: '14px' }}>{domain.label}</b>
                  <span className="mono" style={{ fontSize: '9px', color: fill(tone) }}>
                    {status ? status.status.replace('-', ' ').toUpperCase() : healthLabel[rollup?.health ?? 'unavailable']}
                  </span>
                </div>
                <div className="home-card-progress">
                  <ProgressBar percent={status?.total ? Math.round(status.done * 100 / status.total) : (progress ?? 0)} tone={cardTones[domain.id]} height={4} />
                </div>
                {status?.total ? (
                  <p className="home-card-note mono">
                    {status.next?.text ?? 'No open tasks'} · {status.done}/{status.total} done
                  </p>
                ) : progress === null ? (
                  <p className="home-card-note mono">No sources configured.</p>
                ) : (
                  <p className="home-card-note mono">Source sync · {rollup?.okCount}/{rollup?.entryCount} ({progress}%)</p>
                )}
              </button>
            );
          })}
        </div>
      </QuerySection>

      <div className="home-today">
        <div style={{ padding: '20px 22px' }}>
          <div className="mono" style={eyebrow('accent')}>
            TODAY · {new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date()).toUpperCase()}
          </div>
          <p className="hf">{issues[0]?.message ?? (pendingSources.size ? 'Waiting for the first source sync.' : 'Where should your attention go?')}</p>
          <button type="button" className="home-today-action" onClick={financeAction ? onRecordAssets : onOpenDomains} style={primaryButton}>
            {financeAction ? '▶ Record asset snapshot' : 'Open domains'}
          </button>
        </div>
        <QuerySection
          title="Next actions"
          isPending={signals.isPending}
          isError={signals.isError}
          error={signals.error}
          empty={!actions.length}
          onRetry={() => void signals.refetch()}
        >
          <ol className="home-actions">
            {actions.slice(0, 3).map((signal, index) => (
              <li key={index} data-priority={index === 0}>
                <b>{index + 1} · {signal.suggestedAction}</b>
                <div className="home-action-detail mono">
                  {signal.message}
                </div>
              </li>
            ))}
          </ol>
        </QuerySection>
      </div>

      <section aria-label="Activity timeline" className="home-timeline">
          <QuerySection
            title="◂ Past · What changed"
            isPending={snapshots.isPending}
            isError={snapshots.isError}
            error={snapshots.error}
            empty={false}
            onRetry={() => void snapshots.refetch()}
          >
            {activity.length ? activity.map((item, index) => (
              <div key={index} style={{ marginBottom: '8px' }}>
                <time dateTime={item.timestamp} className="home-action-detail mono">
                  {new Date(item.timestamp).toLocaleDateString()}
                </time>
                <div>{item.title}</div>
              </div>
            )) : <p>No recent activity yet.</p>}
          </QuerySection>
          <QuerySection
            title="● Now · Today’s issue"
            isPending={signals.isPending}
            isError={signals.isError}
            error={signals.error}
            empty={false}
            onRetry={() => void signals.refetch()}
          >
            {issues.length ? issues.slice(0, 3).map((signal, index) => (
              <p key={index}>{signal.message}</p>
            )) : <p>No current signals.</p>}
          </QuerySection>
          <QuerySection
            title="▸ Next · Moves"
            isPending={signals.isPending}
            isError={signals.isError}
            error={signals.error}
            empty={false}
            onRetry={() => void signals.refetch()}
          >
            {actions.length ? actions.slice(0, 3).map((signal, index) => (
              <p key={index}>{signal.suggestedAction}</p>
            )) : <p>No upcoming moves yet.</p>}
          </QuerySection>
      </section>

      <div className="home-source-gates mono">
        <button type="button" onClick={onOpenRegistry}>Source gates · View Registry →</button>
        <button type="button" onClick={onStartReview}>Start weekly review →</button>
      </div>
    </div>
  );
}
