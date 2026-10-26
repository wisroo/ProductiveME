import type { CSSProperties } from 'react';
import {
  heatmapLegend,
  monthlyRollup,
  review,
  weeklyRollup,
} from '../data/mock.js';
import { buildCalendar, type CalendarDay } from '../lib/calendar.js';
import type { BarTone, ReviewMode } from '../types.js';
import {
  eyebrow,
  fill,
  ghostButton,
  primaryButton,
  SummaryTable,
} from './bits.js';

type ReviewProps = {
  mode: ReviewMode;
  onModeChange: (mode: ReviewMode) => void;
};

const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const modePill = (active: boolean): CSSProperties => ({
  fontSize: '10px',
  letterSpacing: '.12em',
  padding: '7px 14px',
  border: 'none',
  cursor: 'pointer',
  background: active ? 'var(--accent)' : 'transparent',
  color: active ? 'var(--accent-ink)' : 'var(--muted)',
  fontWeight: active ? 700 : 500,
});

const legendFill: Readonly<Record<'done' | 'due' | 'blocked' | 'line', string>> = {
  done: 'var(--done-fill)',
  due: 'var(--due-fill)',
  blocked: 'var(--blocked-fill)',
  line: 'var(--line-2)',
};

const dayCellStyle = (day: CalendarDay): CSSProperties => ({
  aspectRatio: '1',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: '7px 8px',
  borderRadius: 'var(--r)',
  background: 'var(--panel)',
  border: day.isToday ? '1px solid var(--accent)' : '1px solid var(--line)',
  opacity: day.isFuture ? 0.38 : 1,
  boxShadow: day.isToday
    ? '0 0 18px -4px var(--accent)'
    : day.score !== null && day.score >= 3
      ? '0 0 15px -5px var(--done-fill)'
      : 'none',
});

const scoreTone: Readonly<Record<number, BarTone>> = {
  3: 'done',
  2: 'due',
  1: 'blocked',
  0: 'parked',
};

const segmentStyle = (day: CalendarDay, active: boolean): CSSProperties => {
  const tone = day.score === null ? undefined : scoreTone[day.score];
  const background = active && tone ? fill(tone) : 'var(--line-2)';

  return {
    flex: 1,
    height: '5px',
    borderRadius: '2px',
    background,
    boxShadow: active && tone ? `0 0 8px -1px ${background}` : 'none',
    transition: 'all .2s',
    opacity: active ? 1 : 0.5,
  };
};

function Narrative({ mode }: { mode: ReviewMode }) {
  const copy = review[mode];

  return (
    <div
      style={{
        borderLeft: '3px solid var(--accent)',
        background: 'var(--panel)',
        padding: '18px 22px',
      }}
    >
      <div className="mono" style={eyebrow('accent')}>
        {copy.label}
      </div>
      <div
        className="hf"
        style={{ fontSize: '17px', lineHeight: 1.65, marginTop: '10px' }}
      >
        <p style={{ margin: 0 }}>{copy.body}</p>
        <p style={{ margin: '1.65em 0 0' }}>
          <b>{copy.emphasis}</b>
          {copy.tail}
        </p>
      </div>
      {mode === 'weekly' ? (
        <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
          <button type="button" className="mono" style={{ ...ghostButton, fontSize: '11px', padding: '7px 13px' }}>
            ↺ Regenerate
          </button>
          <button type="button" className="mono" style={{ ...ghostButton, fontSize: '11px', padding: '7px 13px' }}>
            ✎ Edit
          </button>
        </div>
      ) : null}
    </div>
  );
}

function SaveRow() {
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <button type="button" style={primaryButton}>
        ✦ Save review
      </button>
      <button type="button" style={ghostButton}>
        Export to Notion
      </button>
    </div>
  );
}

function Heatmap() {
  const cells = buildCalendar();

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="hf" style={{ fontSize: '19px', fontWeight: 600 }}>
          {review.monthLabel}
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {heatmapLegend.map((item) => (
            <span
              key={item.label}
              className="mono"
              style={{
                fontSize: '10px',
                color: 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span
                style={{
                  width: '9px',
                  height: '5px',
                  borderRadius: '2px',
                  background: legendFill[item.tone],
                  boxShadow:
                    item.tone === 'done' ? '0 0 8px -1px var(--done-fill)' : undefined,
                }}
              />
              {item.label}
            </span>
          ))}
        </div>
      </div>
      <div
        aria-label={`${review.monthLabel} activity`}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '6px' }}
      >
        {weekdays.map((weekday, index) => (
          <div
            key={`${weekday}-${index}`}
            className="mono"
            style={{
              textAlign: 'center',
              fontSize: '9px',
              letterSpacing: '.1em',
              color: 'var(--faint)',
              paddingBottom: '2px',
            }}
          >
            {weekday}
          </div>
        ))}
        {cells.map((cell, index) =>
          cell.kind === 'blank' ? (
            <div key={`blank-${index}`} style={{ visibility: 'hidden' }} />
          ) : (
            <div
              key={cell.day}
              data-day={cell.day}
              data-today={cell.isToday || undefined}
              data-future={cell.isFuture || undefined}
              style={dayCellStyle(cell)}
            >
              <div
                className="mono"
                style={{
                  fontSize: '11px',
                  color: cell.isToday ? 'var(--accent)' : 'var(--muted)',
                  fontWeight: cell.isToday ? 700 : 400,
                }}
              >
                {cell.day}
              </div>
              <div style={{ display: 'flex', gap: '3px' }}>
                {cell.segments.map((active, segment) => (
                  <div key={segment} style={segmentStyle(cell, active)} />
                ))}
              </div>
            </div>
          ),
        )}
      </div>
    </>
  );
}

export default function Review({ mode, onModeChange }: ReviewProps) {
  const isWeekly = mode === 'weekly';

  return (
    <div
      style={{
        padding: '28px 30px',
        maxWidth: '700px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
      }}
    >
      <div className="mono" style={{ fontSize: '9px', letterSpacing: '.12em', color: 'var(--muted)' }}>PROTOTYPE · illustrative review content</div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div className="mono" style={eyebrow('accent')}>
            ↻ REVIEW MODE
          </div>
          <h1
            className="hf"
            style={{ fontSize: '24px', fontWeight: 600, marginTop: '4px' }}
          >
            {review[mode].title}
          </h1>
        </div>
        <div
          style={{
            display: 'flex',
            border: '1px solid var(--line-2)',
            borderRadius: 'var(--r)',
            overflow: 'hidden',
          }}
        >
          <button
            type="button"
            className="mono"
            aria-pressed={isWeekly}
            onClick={() => onModeChange('weekly')}
            style={modePill(isWeekly)}
          >
            WEEKLY
          </button>
          <button
            type="button"
            className="mono"
            aria-pressed={!isWeekly}
            onClick={() => onModeChange('monthly')}
            style={modePill(!isWeekly)}
          >
            MONTHLY
          </button>
        </div>
      </div>

      <Narrative mode={mode} />

      {isWeekly ? (
        <>
          <div className="mono" style={eyebrow('muted')}>
            DOMAIN SUMMARY · AUTO-PULLED
          </div>
          <SummaryTable rows={weeklyRollup} />
          <div className="mono" style={eyebrow('muted')}>
            DECISIONS FOR NEXT WEEK
          </div>
          <div
            className="mono"
            style={{
              minHeight: '56px',
              padding: '13px 15px',
              border: '1px dashed var(--line-2)',
              borderRadius: 'var(--r)',
              color: 'var(--faint)',
              fontSize: '12px',
            }}
          >
            {review.decisionsPlaceholder}
          </div>
        </>
      ) : (
        <>
          <Heatmap />
          <div className="mono" style={eyebrow('muted')}>
            MONTH ROLLUP · AUTO-PULLED
          </div>
          <SummaryTable rows={monthlyRollup} />
        </>
      )}

      <SaveRow />
    </div>
  );
}
