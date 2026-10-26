import { domains, type DomainId } from '../types.js';
import { useDomainRollups, useSignals, toApiDomainId } from '../lib/api.js';
import { ghostButton, primaryButton } from './bits.js';
import QuerySection from './QuerySection.js';

type HomeProps = {
  onDomainSelect: (domain: DomainId) => void;
  onOpenDomains: () => void;
  onStartReview: () => void;
};

const healthLabel: Record<string, string> = {
  healthy: 'HEALTHY',
  degraded: 'DEGRADED',
  unavailable: 'NO SNAPSHOTS',
};

export default function Home({
  onDomainSelect,
  onOpenDomains,
  onStartReview,
}: HomeProps) {
  const rollups = useDomainRollups();
  const signals = useSignals();

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
          PRODUCTIVEME · LIVE READ MODEL
        </div>
        <h1
          className="hf"
          style={{ fontSize: '30px', lineHeight: 1.16, fontWeight: 600, marginTop: '9px' }}
        >
          Where should your attention go?
        </h1>
      </div>

      <QuerySection
        title="Domain health"
        isPending={rollups.isPending}
        isError={rollups.isError}
        error={rollups.error}
        empty={!rollups.data?.length}
        onRetry={() => void rollups.refetch()}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
          {domains.map((domain) => {
            const rollup = rollups.data?.find(
              (item) => item.domain === toApiDomainId(domain.id),
            );

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
                <div className="mono" style={{ fontSize: '10px', marginTop: '5px' }}>
                  {rollup?.okCount ?? 0}/{rollup?.entryCount ?? 0} sources ·{' '}
                  {rollup?.itemCount ?? 0} items
                </div>
              </button>
            );
          })}
        </div>
      </QuerySection>

      <QuerySection
        title="Signals"
        isPending={signals.isPending}
        isError={signals.isError}
        error={signals.error}
        empty={!signals.data?.length}
        onRetry={() => void signals.refetch()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {signals.data?.map((signal, index) => (
            <div
              key={`${signal.domain}-${signal.entryId ?? index}-${signal.message}`}
              style={{
                padding: '10px 12px',
                border: '1px solid var(--line)',
                borderRadius: 'var(--r)',
              }}
            >
              <b style={{ fontSize: '12px' }}>{signal.message}</b>
              <div
                className="mono"
                style={{ fontSize: '9px', color: 'var(--muted)', marginTop: '4px' }}
              >
                {domains.find(
                  (domain) => toApiDomainId(domain.id) === signal.domain,
                )?.label ?? signal.domain}{' '}
                · {signal.severity.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </QuerySection>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button type="button" onClick={onOpenDomains} style={primaryButton}>
          Open domains
        </button>
        <button type="button" onClick={onStartReview} style={ghostButton}>
          Start weekly review →
        </button>
      </div>
    </div>
  );
}
