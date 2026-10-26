import { Fragment, type CSSProperties, type JSX } from 'react';
import {
  assetSlices,
  career,
  dataAssets,
  finance,
  financeStats,
  funnel,
  life,
  pdata,
  spending,
  studyFields,
  timetable,
  timetableLegend,
} from '../data/mock.js';
import { domains, type DomainId, type TimeBlock } from '../types.js';
import {
  Donut,
  DomainHeading,
  eyebrow,
  fill,
  ink,
  MeterRow,
  panel,
  ProgressBar,
} from './bits.js';
import { toApiDomainId, useDomainSnapshots, useRegistry, useDomainSignals } from '../lib/api.js';
import QuerySection from './QuerySection.js';

type DomainsProps = {
  activeDomain: DomainId;
  onDomainChange: (domain: DomainId) => void;
};

const subTab = (active: boolean): CSSProperties => ({
  padding: '11px 15px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: active ? 700 : 500,
  fontFamily: '"Public Sans",sans-serif',
  background: 'transparent',
  border: 'none',
  borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
  color: active ? 'var(--ink)' : 'var(--muted)',
  marginBottom: '-1px',
});

const warningButton: CSSProperties = {
  padding: '8px 14px',
  border: 'none',
  borderRadius: 'var(--r)',
  background: 'var(--due-fill)',
  color: '#20170a',
  fontWeight: 700,
  fontSize: '12px',
  cursor: 'pointer',
};

function Career() {
  return (
    <div>
      <DomainHeading
        title="Career"
        status={career.status}
        statusTone="blocked"
        scope={career.scope}
      />
      <div
        style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '16px' }}
      >
        <div style={panel}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div className="mono" style={{ ...eyebrow('muted'), letterSpacing: '.12em' }}>
              {career.studyLabel}
            </div>
            <span
              className="mono"
              style={{
                fontSize: '9px',
                padding: '3px 8px',
                border: '1px solid var(--line-2)',
                borderRadius: '99px',
                color: 'var(--done)',
              }}
            >
              {career.studySource}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '11px',
              marginTop: '14px',
            }}
          >
            {studyFields.map((field) => (
              <MeterRow
                key={field.label}
                label={field.label}
                percent={field.percent}
                tone={field.tone}
                value={field.pages}
                labelWidth={100}
                valueWidth={48}
                height={5}
              />
            ))}
          </div>
        </div>
        <div
          style={{
            ...panel,
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div className="mono" style={{ ...eyebrow('muted'), letterSpacing: '.12em' }}>
            {career.funnelLabel}
          </div>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: '7px' }}>
            {funnel.map((stage, index) => (
              <Fragment key={stage.label}>
                {index === 0 ? null : (
                  <div style={{ display: 'flex', alignItems: 'center', color: 'var(--faint)' }}>
                    →
                  </div>
                )}
                <div
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '10px 6px',
                    border: `1px solid ${
                      stage.tone === 'muted' ? 'var(--line)' : ink(stage.tone)
                    }`,
                    borderRadius: 'var(--r)',
                  }}
                >
                  <div className="mono" style={{ fontSize: '8px', color: ink(stage.tone) }}>
                    {stage.label}
                  </div>
                  <b style={{ fontSize: '17px' }}>{stage.count}</b>
                </div>
              </Fragment>
            ))}
          </div>
          <div
            style={{
              padding: '10px 12px',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '12px' }}>{career.draft}</span>
            <button
              type="button"
              style={{
                fontSize: '11px',
                padding: '5px 11px',
                border: 'none',
                borderRadius: 'var(--r)',
                background: 'var(--accent)',
                color: 'var(--accent-ink)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Publish →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Finance() {
  return (
    <div>
      <DomainHeading title="Finance" status={finance.status} statusTone="due" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: '1px',
          background: 'var(--line)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--r2)',
          overflow: 'hidden',
          marginBottom: '16px',
        }}
      >
        {financeStats.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: 'var(--panel)',
              padding: '13px 15px',
              borderTop: stat.flagged ? '2px solid var(--due-fill)' : undefined,
            }}
          >
            <div className="mono" style={{ fontSize: '9px', color: 'var(--muted)' }}>
              {stat.label}
            </div>
            <b
              style={{
                fontSize: stat.flagged ? '16px' : '20px',
                color: stat.flagged ? ink(stat.tone) : undefined,
              }}
            >
              {stat.value}
            </b>
            <div className="mono" style={{ fontSize: '9px', color: ink(stat.tone) }}>
              {stat.note}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '16px' }}>
        <div style={panel}>
          <div className="mono" style={{ ...eyebrow('muted'), letterSpacing: '.12em' }}>
            {finance.spendingLabel}
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '9px',
              marginTop: '14px',
            }}
          >
            {spending.map((row) => (
              <MeterRow
                key={row.label}
                label={row.label}
                labelClass="mono"
                percent={row.percent}
                tone={row.tone}
                value={row.amount}
                labelWidth={78}
                valueWidth={50}
                height={6}
              />
            ))}
          </div>
        </div>
        <div
          style={{ ...panel, display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          <div className="mono" style={{ ...eyebrow('muted'), letterSpacing: '.12em' }}>
            {finance.compositionLabel}
          </div>
          <Donut slices={assetSlices} total={finance.total} unit={finance.currency} />
          <div
            style={{
              border: '1px solid var(--due)',
              borderRadius: 'var(--r)',
              padding: '12px 14px',
            }}
          >
            <div className="mono" style={{ ...eyebrow('due'), letterSpacing: '.12em' }}>
              {finance.overdue.label}
            </div>
            <b style={{ fontSize: '15px', display: 'block', margin: '4px 0 8px' }}>
              {finance.overdue.title}
            </b>
            <button type="button" style={warningButton}>
              {finance.overdue.cta}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonalData() {
  return (
    <div>
      <DomainHeading title="Personal Data" scope={pdata.summary} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '12px',
        }}
      >
        {dataAssets.map((asset) => (
          <div
            key={asset.label}
            style={{
              border: '1px solid var(--line)',
              borderTop: `2px solid ${fill(asset.tone)}`,
              borderRadius: 'var(--r2)',
              padding: '14px 16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <b style={{ fontSize: '13px' }}>{asset.label}</b>
              <span className="mono" style={{ fontSize: '10px', color: 'var(--muted)' }}>
                {asset.size}
              </span>
            </div>
            <div
              className="mono"
              style={{ fontSize: '9px', color: 'var(--muted)', margin: '7px 0' }}
            >
              {asset.detail}
            </div>
            <ProgressBar percent={asset.percent} tone={asset.tone} height={5} />
            <div
              className="mono"
              style={{ fontSize: '9px', color: ink(asset.tone), marginTop: '6px' }}
            >
              {asset.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const blockStyle: Readonly<Record<TimeBlock, CSSProperties>> = {
  career: { background: 'var(--parked-fill)' },
  rest: { background: 'var(--done-fill)' },
  active: { background: 'var(--accent)' },
  protected: { border: '1.5px dashed var(--due)' },
  open: { border: '1px solid var(--line-2)' },
};

function Life() {
  return (
    <div>
      <DomainHeading
        title="Life"
        status={life.status}
        statusTone="blocked"
        scope={life.scope}
      />
      <div
        style={{
          display: 'flex',
          gap: '14px',
          flexWrap: 'wrap',
          fontSize: '10px',
          marginBottom: '12px',
        }}
      >
        {timetableLegend.map((item) => (
          <span
            key={item.label}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <span
              style={{
                width: '9px',
                height: '9px',
                borderRadius: '2px',
                ...blockStyle[item.block],
              }}
            />
            {item.label}
          </span>
        ))}
      </div>
      <div
        aria-label="Weekly timetable"
        style={{
          display: 'grid',
          gridTemplateColumns: '70px repeat(7,1fr)',
          gap: '5px',
          alignItems: 'center',
        }}
      >
        <span />
        {life.days.map((day) => (
          <span
            key={day}
            className="mono"
            style={{
              fontSize: '10px',
              textAlign: 'center',
              color: day === life.highlightDay ? 'var(--accent)' : 'var(--muted)',
            }}
          >
            {day}
          </span>
        ))}
        {timetable.map((row) => (
          <Fragment key={row.label}>
            <span className="mono" style={{ fontSize: '10px', color: 'var(--muted)' }}>
              {row.label}
            </span>
            {row.blocks.map((block, index) => (
              <span
                key={`${row.label}-${index}`}
                data-block={block}
                style={{
                  height: '30px',
                  borderRadius: 'var(--r)',
                  ...blockStyle[block],
                }}
              />
            ))}
          </Fragment>
        ))}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '14px',
          marginTop: '16px',
        }}
      >
        <div
          style={{
            border: '1px solid var(--blocked)',
            borderRadius: 'var(--r2)',
            padding: '14px 16px',
          }}
        >
          <div className="mono" style={{ ...eyebrow('blocked'), letterSpacing: '.12em' }}>
            {life.imbalance.label}
          </div>
          <div style={{ fontSize: '12px', marginTop: '6px', lineHeight: 1.5 }}>
            {life.imbalance.body}
          </div>
        </div>
        <div
          style={{
            border: '1px solid var(--due)',
            borderRadius: 'var(--r2)',
            padding: '14px 16px',
          }}
        >
          <div className="mono" style={{ ...eyebrow('due'), letterSpacing: '.12em' }}>
            {life.protect.label}
          </div>
          <b style={{ fontSize: '14px', display: 'block', margin: '5px 0 8px' }}>
            {life.protect.title}
          </b>
          <button type="button" style={warningButton}>
            {life.protect.cta}
          </button>
        </div>
      </div>
    </div>
  );
}

const panels: Readonly<Record<DomainId, () => JSX.Element>> = {
  career: Career,
  finance: Finance,
  pdata: PersonalData,
  life: Life,
};

export default function Domains({ activeDomain, onDomainChange }: DomainsProps) {
  const Panel = panels[activeDomain];
  const registry = useRegistry();
  const snapshots = useDomainSnapshots(activeDomain);
  const signals = useDomainSignals(activeDomain);
  const apiDomain = toApiDomainId(activeDomain);
  const entries = registry.data?.filter((entry) => entry.domain === apiDomain) ?? [];
  const domainSignals = signals.data ?? [];

  return (
    <div
      style={{
        padding: '24px 30px',
        maxWidth: '980px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
      }}
    >
      <nav
        aria-label="Domains"
        style={{
          display: 'flex',
          gap: '2px',
          flexWrap: 'wrap',
          borderBottom: '1px solid var(--line-2)',
        }}
      >
        {domains.map((domain) => (
          <button
            key={domain.id}
            type="button"
            aria-pressed={domain.id === activeDomain}
            onClick={() => onDomainChange(domain.id)}
            style={subTab(domain.id === activeDomain)}
          >
            {domain.label}
          </button>
        ))}
      </nav>
      <div className="mono" style={{ fontSize: '9px', letterSpacing: '.12em', color: 'var(--accent)' }}>LIVE API DATA · {apiDomain.toUpperCase()}</div>
      <QuerySection title="Registry sources" isPending={registry.isPending} isError={registry.isError} error={registry.error} empty={!entries.length} onRetry={() => void registry.refetch()}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {entries.map((entry) => <div key={entry.id} style={{ padding: '9px 11px', border: '1px solid var(--line)', borderRadius: 'var(--r)' }}><b>{entry.name}</b><div className="mono" style={{ color: 'var(--muted)', fontSize: '9px', marginTop: '4px' }}>{entry.kind} · {entry.connector}</div></div>)}
        </div>
      </QuerySection>
      <QuerySection title="Latest snapshots" isPending={snapshots.isPending} isError={snapshots.isError} error={snapshots.error} empty={!snapshots.data?.length} onRetry={() => void snapshots.refetch()}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {snapshots.data?.map((snapshot) => <div key={snapshot.entryId} style={{ padding: '9px 11px', border: '1px solid var(--line)', borderRadius: 'var(--r)' }}><b>{entries.find((entry) => entry.id === snapshot.entryId)?.name ?? snapshot.entryId}</b><div className="mono" style={{ color: snapshot.status === 'ok' ? 'var(--done)' : 'var(--due)', fontSize: '9px', marginTop: '4px' }}>{snapshot.status.toUpperCase()} · {snapshot.fetchedAt}</div>{snapshot.error ? <div>{snapshot.error}</div> : null}{snapshot.items.map((item, index) => <div key={`${item.title}-${index}`} style={{ fontSize: '12px', marginTop: '6px' }}>{item.link ? <a href={item.link}>{item.title}</a> : item.title}{item.detail ? ` · ${item.detail}` : ''}</div>)}</div>)}
        </div>
      </QuerySection>
      <QuerySection title="Domain signals" isPending={signals.isPending} isError={signals.isError} error={signals.error} empty={!domainSignals.length} onRetry={() => void signals.refetch()}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {domainSignals.map((signal, index) => <div key={`${signal.entryId ?? index}-${signal.message}`} style={{ padding: '9px 11px', border: '1px solid var(--line)', borderRadius: 'var(--r)' }}>{signal.message}<div className="mono" style={{ color: 'var(--muted)', fontSize: '9px', marginTop: '4px' }}>{signal.severity.toUpperCase()}{signal.suggestedAction ? ` · ${signal.suggestedAction}` : ''}</div></div>)}
        </div>
      </QuerySection>
      <div className="mono" style={{ fontSize: '9px', color: 'var(--muted)', borderLeft: '2px solid var(--due)', paddingLeft: '10px' }}>Prototype metrics below are illustrative design data and are not loaded from the API.</div>
      <Panel />
    </div>
  );
}
