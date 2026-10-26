import { domainCards, home, nextActions, timeline } from '../data/mock.js';
import type { DomainId } from '../types.js';
import { eyebrow, fill, ink, ProgressBar } from './bits.js';

type HomeProps = {
  onDomainSelect: (domain: DomainId) => void;
  onOpenDomains: () => void;
  onStartReview: () => void;
};

export default function Home({
  onDomainSelect,
  onOpenDomains,
  onStartReview,
}: HomeProps) {
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
        <div className="mono" style={{ ...eyebrow('accent'), letterSpacing: '.16em' }}>
          {home.eyebrow}
        </div>
        <h1
          className="hf"
          style={{
            fontSize: '30px',
            lineHeight: 1.16,
            fontWeight: 600,
            marginTop: '9px',
            letterSpacing: '-.015em',
          }}
        >
          {home.headline[0]}
          <br />
          {home.headline[1]}
        </h1>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: '10px',
        }}
      >
        {domainCards.map((card) => (
          <button
            key={card.id}
            type="button"
            className="domain-card"
            data-tone={card.tone}
            aria-label={card.label}
            onClick={() => onDomainSelect(card.id)}
            style={{
              background: 'var(--panel)',
              padding: '15px 16px',
              textAlign: 'left',
              color: 'var(--ink)',
              border: '1px solid var(--line)',
              borderTop: `2px solid ${fill(card.tone)}`,
              borderRadius: 'var(--r)',
              transition: 'background .15s ease',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <b style={{ fontSize: '14px' }}>{card.label}</b>
              <span
                className="mono"
                style={{ fontSize: '9px', color: ink(card.badgeTone) }}
              >
                {card.badge}
              </span>
            </div>
            <div style={{ marginTop: '14px' }}>
              <ProgressBar percent={card.progress} tone={card.tone} />
            </div>
            <div
              className="mono"
              style={{ fontSize: '9px', color: 'var(--muted)', marginTop: '9px' }}
            >
              {card.note}
            </div>
          </button>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.15fr 1fr',
          border: '1px solid var(--line-2)',
          borderLeft: '3px solid var(--accent)',
          borderRadius: '0 var(--r2) var(--r2) 0',
          background: 'var(--panel)',
          boxShadow: '-1px 0 16px -4px var(--accent)',
        }}
      >
        <div style={{ borderRight: '1px solid var(--line)', padding: '20px 22px' }}>
          <div className="mono" style={eyebrow('accent')}>
            {home.today.label}
          </div>
          <p
            className="hf"
            style={{
              fontSize: '16px',
              lineHeight: 1.6,
              margin: '11px 0 16px',
              color: 'var(--ink)',
            }}
          >
            {home.today.lead}
            <span style={{ color: 'var(--due)', fontWeight: 600 }}>
              {home.today.highlight}
            </span>
            {home.today.tail}
          </p>
          <button
            type="button"
            onClick={onOpenDomains}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '11px 17px',
              border: 'none',
              borderRadius: 'var(--r)',
              background: 'var(--accent)',
              color: 'var(--accent-ink)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {home.today.cta}
          </button>
        </div>
        <div
          style={{
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '9px',
          }}
        >
          <div className="mono" style={eyebrow('muted')}>
            NEXT ACTIONS
          </div>
          {nextActions.map((action) => (
            <div
              key={action.rank}
              style={{
                padding: '10px 12px',
                border: '1px solid var(--line)',
                borderLeft: action.flagged
                  ? `2px solid ${fill(action.tone)}`
                  : undefined,
                borderRadius: 'var(--r)',
              }}
            >
              <b style={{ fontSize: '12px' }}>
                {action.rank} · {action.title}
              </b>
              <div className="mono" style={{ fontSize: '9px', color: ink(action.tone) }}>
                {action.meta}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '24px',
          paddingTop: '16px',
          borderTop: '1px solid var(--line-2)',
        }}
      >
        {timeline.map((column) => (
          <div key={column.label}>
            <div className="mono" style={eyebrow(column.tone, 9)}>
              {column.label}
            </div>
            <div
              className="mono"
              style={{
                fontSize: '11px',
                color: 'var(--muted)',
                lineHeight: 2,
                marginTop: '9px',
              }}
            >
              {column.lines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div
        className="mono"
        style={{
          fontSize: '11px',
          color: 'var(--muted)',
          padding: '13px 16px',
          border: '1px dashed var(--line-2)',
          borderRadius: 'var(--r)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>{home.sourceGates}</span>
        <button
          type="button"
          onClick={onStartReview}
          className="mono"
          style={{
            border: 'none',
            background: 'transparent',
            padding: 0,
            fontSize: '11px',
            color: 'var(--accent)',
            cursor: 'pointer',
          }}
        >
          Start weekly review →
        </button>
      </div>
    </div>
  );
}
