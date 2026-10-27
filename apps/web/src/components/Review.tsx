import { useState, type CSSProperties } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ReviewApiError, type ReviewDraft } from '@productiveme/api-client';
import { useApi } from '../lib/api.js';
import type { ReviewMode } from '../types.js';
import {
  eyebrow,
  ghostButton,
  primaryButton,
} from './bits.js';

type ReviewProps = {
  mode: ReviewMode;
  onModeChange: (mode: ReviewMode) => void;
};

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

const errorMessage = (error: unknown): string => {
  if (!(error instanceof ReviewApiError)) return 'Could not reach the review service. Check the API connection and try again.';
  switch (error.code) {
    case 'inference_disabled': return 'Review generation is not enabled. Configure the API with a private Ollama server, then try again.';
    case 'generation_busy': return 'Another review is being generated. Wait a moment, then try again.';
    case 'inference_timeout': return 'Review generation took too long. Check that the model is running, then try again.';
    case 'inference_unavailable': return 'The review service is unavailable. Check the Ollama server and model, then try again.';
    case 'inference_invalid_response': return 'The review service returned an invalid draft. Try again.';
    case 'inference_failed': return 'Review generation failed. Try again.';
    case 'unknown': return 'Could not reach the review service. Check the API connection and try again.';
  }
};

const formatRange = (start: string, end: string) => {
  const date = (value: string) => new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(value));
  return `${date(start)} – ${date(end)}`;
};

export default function Review({ mode, onModeChange }: ReviewProps) {
  const isWeekly = mode === 'weekly';
  const api = useApi();
  const [draft, setDraft] = useState<ReviewDraft | null>(null);
  const mutation = useMutation({
    mutationFn: (period: ReviewMode) => api.createReview(period),
    onSuccess: setDraft,
  });
  const visibleDraft = draft?.period === mode ? draft : null;
  const busy = mutation.isPending;

  const changeMode = (nextMode: ReviewMode) => {
    if (busy) return;
    mutation.reset();
    onModeChange(nextMode);
  };

  const generate = () => {
    if (!busy) mutation.mutate(mode);
  };

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
            {isWeekly ? 'Weekly review' : 'Monthly review'}
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
            disabled={busy}
            onClick={() => changeMode('weekly')}
            style={modePill(isWeekly)}
          >
            WEEKLY
          </button>
          <button
            type="button"
            className="mono"
            aria-pressed={!isWeekly}
            disabled={busy}
            onClick={() => changeMode('monthly')}
            style={modePill(!isWeekly)}
          >
            MONTHLY
          </button>
        </div>
      </div>

      <section aria-labelledby="draft-heading" style={{ borderLeft: '3px solid var(--accent)', background: 'var(--panel)', padding: '18px 22px' }}>
        <div id="draft-heading" className="mono" style={eyebrow('accent')}>GENERATED DRAFT</div>
        <p className="mono" style={{ color: 'var(--muted)', fontSize: '12px', lineHeight: 1.6 }}>
          Create a draft from recent snapshots and computed signals for this period.
        </p>
        {visibleDraft ? (
          <>
            <div className="mono" style={{ color: 'var(--muted)', fontSize: '11px', margin: '14px 0' }}>
              {formatRange(visibleDraft.rangeStart, visibleDraft.rangeEnd)}
            </div>
            <div className="hf" style={{ fontSize: '16px', lineHeight: 1.65, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              {visibleDraft.draft}
            </div>
          </>
        ) : null}
        {mutation.isError ? <p role="alert" className="mono" style={{ color: 'var(--blocked-fill)', fontSize: '12px' }}>{errorMessage(mutation.error)}</p> : null}
        <button type="button" className="mono" style={{ ...ghostButton, marginTop: '14px' }} onClick={generate} disabled={busy}>
          {busy ? 'Generating review' : visibleDraft ? 'Regenerate review' : 'Generate review'}
        </button>
        {busy ? <p role="status" className="mono" style={{ color: 'var(--muted)', fontSize: '11px' }}>Waiting for the local review service…</p> : null}
      </section>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button type="button" style={{ ...primaryButton, opacity: 0.55, cursor: 'not-allowed' }} disabled title="Saving reviews is not available yet">✦ Save review · unavailable</button>
        <button type="button" style={{ ...ghostButton, opacity: 0.55, cursor: 'not-allowed' }} disabled title="Export is not available yet">Export · unavailable</button>
      </div>
    </div>
  );
}
