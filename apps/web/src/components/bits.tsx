import type { CSSProperties } from 'react';
import type { BarTone, DomainSummaryRow, Tone } from '../types.js';

const fills: Readonly<Record<BarTone, string>> = {
  done: 'var(--done-fill)',
  due: 'var(--due-fill)',
  parked: 'var(--parked-fill)',
  blocked: 'var(--blocked-fill)',
  accent: 'var(--accent)',
  muted: 'var(--muted)',
  faint: 'var(--faint)',
};

const inks: Readonly<Record<BarTone, string>> = {
  done: 'var(--done)',
  due: 'var(--due)',
  parked: 'var(--parked)',
  blocked: 'var(--blocked)',
  accent: 'var(--accent)',
  muted: 'var(--muted)',
  faint: 'var(--faint)',
};

/** Solid fill for bars, dots and borders. */
export const fill = (tone: BarTone) => fills[tone];
/** Text-weight variant of the same tone. */
export const ink = (tone: BarTone) => inks[tone];

export const eyebrow = (tone: BarTone, size = 10): CSSProperties => ({
  fontSize: `${size}px`,
  letterSpacing: '.14em',
  color: ink(tone),
});

export const panel: CSSProperties = {
  border: '1px solid var(--line)',
  borderRadius: 'var(--r2)',
  padding: '16px 18px',
};

export const primaryButton: CSSProperties = {
  padding: '10px 16px',
  border: 'none',
  borderRadius: 'var(--r)',
  background: 'var(--accent)',
  color: 'var(--accent-ink)',
  fontWeight: 700,
  fontSize: '13px',
  cursor: 'pointer',
};

export const ghostButton: CSSProperties = {
  padding: '10px 16px',
  border: '1px solid var(--line-2)',
  borderRadius: 'var(--r)',
  background: 'transparent',
  color: 'var(--ink)',
  fontSize: '13px',
  cursor: 'pointer',
};

export function Pill({ label, tone }: { label: string; tone: BarTone }) {
  return (
    <span
      className="mono"
      style={{
        fontSize: '9px',
        padding: '3px 8px',
        border: `1px solid ${ink(tone)}`,
        color: ink(tone),
        borderRadius: '99px',
      }}
    >
      {label}
    </span>
  );
}

export function ProgressBar({
  percent,
  tone,
  height = 4,
}: {
  percent: number;
  tone: BarTone;
  height?: number;
}) {
  return (
    <div
      style={{
        height: `${height}px`,
        borderRadius: '99px',
        background: 'var(--track)',
        overflow: 'hidden',
      }}
    >
      <i
        style={{
          display: 'block',
          height: '100%',
          width: `${percent}%`,
          background: fill(tone),
        }}
      />
    </div>
  );
}

/** Label · bar · value row used by the Career study list and Finance spending list. */
export function MeterRow({
  label,
  percent,
  tone,
  value,
  labelWidth,
  labelClass,
  valueWidth,
  height,
}: {
  label: string;
  percent: number;
  tone: BarTone;
  value: string;
  labelWidth: number;
  labelClass?: string;
  valueWidth: number;
  height: number;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span
        className={labelClass}
        style={{
          width: `${labelWidth}px`,
          fontSize: labelClass ? '10px' : '12px',
          color: labelClass ? 'var(--muted)' : undefined,
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1 }}>
        <ProgressBar percent={percent} tone={tone} height={height} />
      </div>
      <span
        className="mono"
        style={{
          fontSize: '10px',
          width: `${valueWidth}px`,
          textAlign: 'right',
          color: labelClass ? undefined : 'var(--muted)',
        }}
      >
        {value}
      </span>
    </div>
  );
}

/** Tone-striped rows shared by the weekly and monthly review rollups. */
export function SummaryTable({ rows }: { rows: readonly DomainSummaryRow[] }) {
  return (
    <div
      style={{
        border: '1px solid var(--line)',
        borderRadius: 'var(--r2)',
        overflow: 'hidden',
      }}
    >
      {rows.map((row, index) => (
        <div
          key={row.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 15px',
            borderBottom:
              index === rows.length - 1 ? undefined : '1px solid var(--line)',
            borderLeft: `2px solid ${fill(row.tone)}`,
          }}
        >
          <b style={{ width: '110px', fontSize: '13px' }}>{row.label}</b>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--muted)' }}>
            {row.summary}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Conic-gradient asset donut with a hollow centre showing the total. */
export function Donut({
  slices,
  total,
  unit,
}: {
  slices: ReadonlyArray<{ label: string; percent: number; tone: BarTone }>;
  total: string;
  unit: string;
}) {
  let cursor = 0;
  const stops = slices.map((slice) => {
    const from = cursor;
    cursor += slice.percent;
    return `${fill(slice.tone)} ${from}% ${cursor}%`;
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
      <div
        style={{
          width: '104px',
          height: '104px',
          borderRadius: '50%',
          background: `conic-gradient(${stops.join(', ')})`,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '26px',
            background: 'var(--panel)',
            borderRadius: '50%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <b className="mono" style={{ fontSize: '11px' }}>
            {total}
          </b>
          <span className="mono" style={{ fontSize: '8px', color: 'var(--muted)' }}>
            {unit}
          </span>
        </div>
      </div>
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}
      >
        {slices.map((slice) => (
          <div
            key={slice.label}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '2px',
                background: fill(slice.tone),
              }}
            />
            {slice.label} {slice.percent}%
          </div>
        ))}
      </div>
    </div>
  );
}

/** Section heading shared by the four domain panels. */
export function DomainHeading({
  title,
  status,
  statusTone,
  scope,
}: {
  title: string;
  status?: string;
  statusTone?: Tone;
  scope?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '16px',
      }}
    >
      <h1 className="hf" style={{ fontSize: '21px', fontWeight: 700 }}>
        {title}
      </h1>
      {status && statusTone ? <Pill label={status} tone={statusTone} /> : null}
      {scope ? (
        <span
          className="mono"
          style={{ fontSize: '10px', color: 'var(--muted)', marginLeft: 'auto' }}
        >
          {scope}
        </span>
      ) : null}
    </div>
  );
}
