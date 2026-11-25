import { useQuery } from '@tanstack/react-query';
import { domains, type DomainId } from '../types.js';
import { useApi, useDomainRollups, useSignals, toApiDomainId } from '../lib/api.js';
import { eyebrow, fill, ghostButton, primaryButton, ProgressBar } from './bits.js';
import QuerySection from './QuerySection.js';

type HomeProps = {
  onDomainSelect: (domain: DomainId) => void;
  onOpenDomains: () => void;
  onStartReview: () => void;
};

const healthLabel: Record<string, string> = {
  healthy: 'HEALTHY',
  degraded: 'DEGRADED',
  unavailable: 'UNAVAILABLE',
};

export default function Home({
  onDomainSelect,
  onOpenDomains,
  onStartReview,
}: HomeProps) {
  const rollups = useDomainRollups();
  const signals = useSignals();
  const api = useApi();
  const snapshots = useQuery({ queryKey: ['snapshots'], queryFn: () => api.getSnapshots() });
  const activity = (snapshots.data ?? [])
    .filter((snapshot) => snapshot.status === 'ok')
    .flatMap((snapshot) => snapshot.items)
    .flatMap((item) => {
      const timestamp = item.timestamp;
      return timestamp && Number.isFinite(Date.parse(timestamp)) ? [{ ...item, timestamp }] : [];
    })
    .sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp))
    .slice(0, 6);
  const actions = (signals.data ?? []).filter((signal) => signal.suggestedAction?.trim());
  const issues = signals.data ?? [];

  return (
    <div
      style={{
        padding: '28px 30px',
        maxWidth: '980px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      <div>
        <div
          className="mono"
          style={{ fontSize: '10px', letterSpacing: '.16em', color: 'var(--accent)' }}
        >
          WHERE AM I · WHAT CHANGED · WHAT’S NEXT
        </div>
        <h1
          className="hf"
          style={{ fontSize: '30px', lineHeight: 1.16, fontWeight: 600, marginTop: '9px' }}
        >
          Where should your attention go?
        </h1>
      </div>

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

            const tone = rollup?.health === 'healthy' ? 'done' : rollup?.health === 'degraded' ? 'due' : 'parked';
            const progress = rollup?.entryCount ? Math.round(100 * rollup.okCount / rollup.entryCount) : null;
            return (
              <button
                key={domain.id}
                type="button"
                className="domain-card"
                aria-label={domain.label}
                onClick={() => onDomainSelect(domain.id)}
                style={{
                  background: 'var(--panel)',
                  padding: '15px 16px',
                  textAlign: 'left',
                  color: 'var(--ink)',
                  border: '1px solid var(--line)',
                  borderTop: `2px solid ${fill(tone)}`,
                  borderRadius: 'var(--r)',
                  cursor: 'pointer',
                }}
              >
                <b style={{ fontSize: '14px' }}>{domain.label}</b>
                <div
                  className="mono"
                  style={{ fontSize: '9px', color: 'var(--muted)', marginTop: '12px' }}
                >
                  {healthLabel[rollup?.health ?? 'unavailable']}
                </div>
                {progress === null ? (
                  <p className="mono" style={{ fontSize: '10px' }}>No sources configured.</p>
                ) : (
                  <div style={{ marginTop: '12px' }}>
                    <ProgressBar percent={progress} tone={tone} />
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

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(245px, 1fr))',
        borderLeft: '3px solid var(--accent)',
        background: 'var(--panel)',
      }}>
        <div style={{ padding: '20px 22px' }}>
          <div className="mono" style={eyebrow('accent')}>TODAY</div>
          <p className="hf">{issues[0]?.message ?? 'Where should your attention go?'}</p>
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
          <ol style={{ margin: 0, paddingLeft: '20px' }}>
            {actions.map((signal, index) => (
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: '12px' }}>
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

      <button type="button" onClick={onStartReview} style={{ ...ghostButton, alignSelf: 'flex-end' }}>
        Start weekly review →
      </button>
    </div>
  );
}
