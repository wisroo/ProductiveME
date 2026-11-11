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
    case 'inference_disabled': return 'Review generation is not enabled. Configure the API with a model provider, then try again.';
    case 'generation_busy': return 'Another review is being generated. Wait a moment, then try again.';
    case 'inference_timeout': return 'Review generation took too long. Check that the model is running, then try again.';
    case 'inference_unavailable': return 'The review service is unavailable. Check the configured provider and model, then try again.';
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

const reviewKey = (mode: ReviewMode) => `productiveme:review:${mode}`;

type FinalReview = ReviewDraft & { finalizedAt: string };
const historyKey = (mode: ReviewMode) => `productiveme:review-history:${mode}`;
const validDate = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(Date.parse(value));

function isReview(value: unknown, mode: ReviewMode): value is ReviewDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Partial<ReviewDraft>;
  return draft.period === mode && typeof draft.draft === 'string'
    && validDate(draft.rangeStart) && validDate(draft.rangeEnd);
}

function readStorage(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null') as unknown;
  } catch {
    return null;
  }
}

function readSavedReview(mode: ReviewMode): ReviewDraft | null {
  const value = readStorage(reviewKey(mode));
  return isReview(value, mode) ? value : null;
}

function readHistory(mode: ReviewMode): FinalReview[] {
  const value = readStorage(historyKey(mode));
  if (!Array.isArray(value)) return [];
  return value.filter((item: unknown): item is FinalReview =>
    isReview(item, mode) && 'finalizedAt' in item && validDate(item.finalizedAt));
}

function exportReview(review: FinalReview) {
  const title = review.period === 'weekly' ? 'Weekly review' : 'Monthly review';
  const file = new Blob([`# ${title}\n\n${formatRange(review.rangeStart, review.rangeEnd)}\n\n${review.draft}\n`], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = `productiveme-${review.period}-${new Date(review.rangeEnd).toISOString().slice(0, 10)}.md`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function Review({ mode, onModeChange }: ReviewProps) {
  const isWeekly = mode === 'weekly';
  const api = useApi();
  const [drafts, setDrafts] = useState(() => ({
    weekly: readSavedReview('weekly'),
    monthly: readSavedReview('monthly'),
  }));
  const [history, setHistory] = useState(() => ({ weekly: readHistory('weekly'), monthly: readHistory('monthly') }));
  const [editedText, setEditedText] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'finalized' | 'error' | null>(null);
  const mutation = useMutation({
    mutationFn: (period: ReviewMode) => api.createReview(period),
    onSuccess: (draft) => setDrafts((current) => ({ ...current, [draft.period]: draft })),
  });
  const visibleDraft = drafts[mode];
  const editing = editedText !== null;
  const busy = mutation.isPending;

  const changeMode = (nextMode: ReviewMode) => {
    if (busy || editing) return;
    setSaveStatus(null);
    mutation.reset();
    onModeChange(nextMode);
  };

  const generate = () => {
    if (busy || editing) return;
    setSaveStatus(null);
    mutation.mutate(mode);
  };

  const save = () => {
    if (!visibleDraft || busy || (editedText !== null && !editedText.trim())) return;
    const nextDraft = { ...visibleDraft, draft: editedText ?? visibleDraft.draft };
    try {
      localStorage.setItem(reviewKey(mode), JSON.stringify(nextDraft));
      setDrafts((current) => ({ ...current, [mode]: nextDraft }));
      setEditedText(null);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  };

  const finalize = () => {
    if (!visibleDraft || busy || editing || !visibleDraft.draft.trim()) return;
    const stored = readHistory(mode);
    const { rangeStart, rangeEnd, draft } = visibleDraft;
    if (stored.some((review) => review.rangeStart === rangeStart && review.rangeEnd === rangeEnd && review.draft === draft)) {
      setHistory((current) => ({ ...current, [mode]: stored }));
      setSaveStatus('finalized');
      return;
    }
    const next = [{ ...visibleDraft, finalizedAt: new Date().toISOString() }, ...stored];
    try {
      localStorage.setItem(historyKey(mode), JSON.stringify(next));
      setHistory((current) => ({ ...current, [mode]: next }));
      setSaveStatus('finalized');
    } catch {
      setSaveStatus('error');
    }
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
            disabled={busy || editing}
            onClick={() => changeMode('weekly')}
            style={modePill(isWeekly)}
          >
            WEEKLY
          </button>
          <button
            type="button"
            className="mono"
            aria-pressed={!isWeekly}
            disabled={busy || editing}
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
            {editing ? (
              <textarea
                aria-label="Review text"
                value={editedText}
                onChange={(event) => setEditedText(event.target.value)}
                rows={8}
                style={{ width: '100%', font: 'inherit', color: 'inherit', background: 'var(--panel)', border: '1px solid var(--line-2)' }}
              />
            ) : (
              <div className="hf" style={{ fontSize: '16px', lineHeight: 1.65, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                {visibleDraft.draft}
              </div>
            )}
          </>
        ) : null}
        {mutation.isError ? <p role="alert" className="mono" style={{ color: 'var(--blocked-fill)', fontSize: '12px' }}>{errorMessage(mutation.error)}</p> : null}
        <button type="button" className="mono" style={{ ...ghostButton, marginTop: '14px' }} onClick={generate} disabled={busy || editing}>
          {busy ? 'Generating review' : visibleDraft ? 'Regenerate review' : 'Generate review'}
        </button>
        {busy ? <p role="status" className="mono" style={{ color: 'var(--muted)', fontSize: '11px' }}>Waiting for the review service…</p> : null}
      </section>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        {visibleDraft && (
          <>
            <button type="button" style={ghostButton} disabled={busy} onClick={() => {
              setSaveStatus(null);
              setEditedText(editing ? null : visibleDraft.draft);
            }}>
              {editing ? 'Cancel edit' : 'Edit review'}
            </button>
            <button type="button" style={ghostButton} disabled={busy || editing || !visibleDraft.draft.trim()} onClick={finalize}>Finalize review</button>
            <button type="button" style={primaryButton} disabled={busy || (editing && !editedText.trim())} onClick={save}>Save review</button>
          </>
        )}
      </div>
      {history[mode].length > 0 && (
        <section aria-label="Review history">
          <h2>Review history</h2>
          {history[mode].map((review, index) => (
            <details key={`${review.finalizedAt}-${index}`}>
              <summary>{formatRange(review.rangeStart, review.rangeEnd)} · {new Date(review.finalizedAt).toLocaleString()}</summary>
              <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{review.draft}</p>
              <button type="button" style={ghostButton} onClick={() => exportReview(review)}>Export Markdown</button>
            </details>
          ))}
        </section>
      )}
      {saveStatus === 'finalized' ? <p role="status">Review finalized and saved in this browser</p> : null}
      {saveStatus === 'saved' ? <p role="status">Saved in this browser</p> : null}
      {saveStatus === 'error' ? <p role="alert">Could not save in this browser. Check browser storage and try again.</p> : null}
    </div>
  );
}
