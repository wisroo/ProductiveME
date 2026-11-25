import { domains, type DomainId } from '../types.js';
import { useDomainRollups, useHomeStatus, useSignals, useSnapshots, toApiDomainId } from '../lib/api.js';
import { eyebrow, fill, primaryButton, ProgressBar } from './bits.js';
import QuerySection from './QuerySection.js';

type HomeProps = {
  week?: string;
  onDomainSelect: (domain: DomainId) => void;
  onOpenDomains: () => void;
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

  return (
    <div className="handoff-page handoff-home">
      {(sourceAlert || hasSourceError) && (
        <div className="home-source-banner" role="status">
          <div>
            <b className="mono">Source read unavailable</b>
            <p>{sourceAlert ? `${sourceAlert.name} is unavailable.` : 'Some source data is unavailable.'}
              {sourceAlert?.lastGoodReadAt && <> Last good read <time dateTime={sourceAlert.lastGoodReadAt}>{new Date(sourceAlert.lastGoodReadAt).toLocaleString()}</time>.</>}
              {' Data may be stale.'}
            </p>
          </div>
          <button type="button" className="shell-button" onClick={onOpenRegistry}>View sources</button>
        </div>
      )}
      <div>
        <div
          className="mono"
          style={{ fontSize: '10px', letterSpacing: '.16em', color: 'var(--accent)' }}
        >
          WHERE AM I · WHAT CHANGED · WHAT’S NEXT
        </div>
        <h1
          className="handoff-title hf"
          style={{ fontSize: '30px', lineHeight: 1.16, fontWeight: 600, marginTop: '9px' }}
        >
          Where should your attention go?
        </h1>
      </div>

      {noSources && (
        <section className="home-empty">
          <p>No sources are configured.</p>
          <button type="button" className="shell-button" onClick={onOpenRegistry}>View Registry →</button>
        </section>
      )}
      <QuerySection
        title="Domain progress"
        isPending={rollups.isPending}
        isError={rollups.isError}
        error={rollups.error}
        empty={false}
        onRetry={() => void rollups.refetch()}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: '10px' }}>
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
                data-tone={tone}
                aria-label={domain.label}
                onClick={() => onDomainSelect(domain.id)}
                style={{
                  background: 'var(--panel)',
                  padding: '15px 16px',
                  textAlign: 'left',
                  color: 'var(--ink)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--r)',
                  cursor: 'pointer',
                }}
              >
                <div className="home-card-heading">
                  <b style={{ fontSize: '14px' }}>{domain.label}</b>
                  <span className="mono" style={{ fontSize: '9px', color: fill(tone) }}>
                    {status ? status.status.replace('-', ' ').toUpperCase() : healthLabel[rollup?.health ?? 'unavailable']}
                  </span>
                </div>
                {status && <p className="mono" style={{ fontSize: '10px' }}>
                  {status.done}/{status.total} tasks · {status.next?.text ?? 'No open tasks'}
                </p>}
                {progress === null ? (
                  <p className="mono" style={{ fontSize: '10px' }}>No sources configured.</p>
                ) : (
                  <div style={{ marginTop: '12px' }}>
                    <ProgressBar percent={status?.total ? Math.round(status.done * 100 / status.total) : progress} tone={tone} />
                    <p className="mono" style={{ fontSize: '10px' }}>
                      Source sync · {rollup?.okCount}/{rollup?.entryCount} ({progress}%)
                    </p>
                  </div>
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
          <button type="button" onClick={onOpenDomains} style={primaryButton}>Open domains</button>
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
              <li key={index} style={{ padding: '8px 0' }}>
                <b style={{ fontSize: '12px' }}>{signal.suggestedAction}</b>
                <div className="mono" style={{ fontSize: '10px', color: 'var(--muted)' }}>
                  {signal.message}
                </div>
              </li>
            ))}
          </ol>
        </QuerySection>
      </div>

      <section aria-labelledby="activity-heading">
        <h2 id="activity-heading" className="mono" style={eyebrow('muted')}>Activity timeline</h2>
        <div className="home-timeline">
          <QuerySection
            title="Past · Recent activity"
            isPending={snapshots.isPending}
            isError={snapshots.isError}
            error={snapshots.error}
            empty={false}
            onRetry={() => void snapshots.refetch()}
          >
            {activity.length ? activity.map((item, index) => (
              <div key={index} style={{ marginBottom: '8px' }}>
                <time dateTime={item.timestamp} className="mono" style={{ fontSize: '10px', color: 'var(--muted)' }}>
                  {new Date(item.timestamp).toLocaleDateString()}
                </time>
                <div>{item.title}</div>
              </div>
            )) : <p>No recent activity yet.</p>}
          </QuerySection>
          <QuerySection
            title="Now · Signals"
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
            title="Next · Moves"
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
        </div>
      </section>

      <div className="home-source-gates mono">
        <button type="button" onClick={onOpenRegistry}>Source gates · View Registry →</button>
        <button type="button" onClick={onStartReview}>Start weekly review →</button>
      </div>
    </div>
  );
}
