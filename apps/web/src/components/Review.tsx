import { useState, type CSSProperties } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ReviewApiError, type ReviewDraft, type ReviewEntry, type SavedReviewDraft } from '@productiveme/api-client';
import { toApiDomainId, useApi, useHomeStatus } from '../lib/api.js';
import { domains, type ReviewMode } from '../types.js';
import {
  eyebrow,
  ghostButton,
  primaryButton,
} from './bits.js';

type ReviewProps = {
  mode: ReviewMode;
  onModeChange: (mode: ReviewMode) => void;
  periodStart?: string;
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

const formatRange = (start: string, end: string, timeZone = 'UTC') => {
  const date = (value: string) => new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone,
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

function exportReview(review: ReviewEntry) {
  const title = review.period === 'weekly' ? 'Weekly review' : 'Monthly review';
  const file = new Blob([`# ${title}\n\n${formatRange(review.rangeStart, review.rangeEnd)}\n\n${review.draft}\n${review.decisions ? `\n## Decisions\n\n${review.decisions}\n` : ''}`], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = `productiveme-${review.period}-${new Date(review.rangeEnd).toISOString().slice(0, 10)}.md`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function Review({ mode, onModeChange, periodStart }: ReviewProps) {
  const isWeekly = mode === 'weekly';
  const timeZone = periodStart ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined;
  const api = useApi();
  const client = useQueryClient();
  const status = useHomeStatus(isWeekly ? periodStart : undefined);
  const [drafts, setDrafts] = useState<Partial<Record<ReviewMode, SavedReviewDraft>>>({});
  const [decisions, setDecisions] = useState<Partial<Record<ReviewMode, string>>>({});
  const [editedText, setEditedText] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'finalized' | 'imported' | 'error' | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [imported, setImported] = useState(false);
  const [legacy] = useState(() => (['weekly', 'monthly'] as const).map((period) => ({
    draft: readSavedReview(period), entries: readHistory(period),
  })));
  const saved = useQuery({ queryKey: ['review-draft', mode], queryFn: () => api.getReviewDraft(mode) });
  const history = useQuery({ queryKey: ['review-entries', mode], queryFn: () => api.getReviewEntries(mode), enabled: historyOpen });

  const mutation = useMutation({
    mutationFn: (period: ReviewMode) => api.createReview(period, periodStart, timeZone),
    onSuccess: (draft) => setDrafts((current) => ({ ...current, [draft.period]: draft })),
  });
  const persist = useMutation({
    mutationFn: async ({ draft, archive }: { draft: SavedReviewDraft; archive: boolean }) => {
      if (archive) await api.archiveReview(draft);
      else await api.saveReviewDraft(draft);
      return draft;
    },
    onSuccess: (draft, { archive }) => {
      setDrafts((current) => ({ ...current, [draft.period]: draft }));
      setEditedText(null);
      setSaveStatus(archive ? 'finalized' : 'saved');
      if (archive) {
        setHistoryOpen(true);
        void client.invalidateQueries({ queryKey: ['review-entries', draft.period] });
      } else client.setQueryData(['review-draft', draft.period], draft);
    },
    onError: () => setSaveStatus('error'),
  });
  const importReviews = useMutation({
    mutationFn: async () => {
      for (const { draft, entries } of legacy) {
        if (draft) await api.saveReviewDraft(draft, true);
        for (const entry of entries) await api.archiveReview(entry);
      }
    },
    onSuccess: async () => {
      setImported(true);
      setSaveStatus('imported');
      await Promise.all([
        client.invalidateQueries({ queryKey: ['review-draft'] }),
        client.invalidateQueries({ queryKey: ['review-entries'] }),
      ]);
    },
    onError: () => setSaveStatus('error'),
  });
  const visibleDraft = drafts[mode] ?? saved.data;
  const editing = editedText !== null;
  const busy = mutation.isPending || persist.isPending || importReviews.isPending;

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

  const saveReview = (archive: boolean) => {
    if (!visibleDraft || busy) return;
    const draft = editedText ?? visibleDraft.draft;
    if (!draft.trim()) return;
    setSaveStatus(null);
    persist.mutate({ draft: { ...visibleDraft, draft, decisions: decisions[mode] ?? visibleDraft.decisions ?? '' }, archive });
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

      {status.data?.sourceAlerts.length ? (
        <div className="home-source-banner" role="status">
          <div><b className="mono">Source data may be stale</b>
            <p>{status.data.sourceAlerts.map(({ name, lastGoodReadAt }) =>
              `${name}${lastGoodReadAt ? ` · last good read ${new Date(lastGoodReadAt).toLocaleString()}` : ''}`,
            ).join(' · ')}</p>
          </div>
        </div>
      ) : null}
      <section aria-labelledby="draft-heading" style={{ borderLeft: '3px solid var(--accent)', background: 'var(--panel)', padding: '18px 22px' }}>
        <div id="draft-heading" className="mono" style={eyebrow('accent')}>GENERATED DRAFT</div>
        <p className="mono" style={{ color: 'var(--muted)', fontSize: '12px', lineHeight: 1.6 }}>
          Create a draft from recent snapshots and computed signals for this period.
        </p>
        {visibleDraft ? (
          <>
            <div className="mono" style={{ color: 'var(--muted)', fontSize: '11px', margin: '14px 0' }}>
              {formatRange(visibleDraft.rangeStart, visibleDraft.rangeEnd, timeZone)}
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
          {mutation.isPending ? 'Generating review' : visibleDraft ? 'Regenerate review' : 'Generate review'}
        </button>
        {mutation.isPending ? <p role="status" className="mono" style={{ color: 'var(--muted)', fontSize: '11px' }}>Waiting for the review service…</p> : null}
      </section>

      {isWeekly && status.data && (
        <section aria-label="Domain summary" className="query-section">
          <h2 className="hf">Domain summary</h2>
          <ul className="task-carry">
            {status.data.domains.map((item) => (
              <li key={item.domain}><b>{domains.find(({ id }) => toApiDomainId(id) === item.domain)?.label ?? item.domain}</b><span>{item.reason}</span></li>
            ))}
          </ul>
        </section>
      )}
      {visibleDraft && (
        <label>
          Decisions for next {isWeekly ? 'week' : 'month'}
          <textarea value={decisions[mode] ?? visibleDraft.decisions ?? ''} maxLength={6000}
            onChange={(event) => setDecisions((current) => ({ ...current, [mode]: event.target.value }))}
            rows={3} style={{ display: 'block', width: '100%', font: 'inherit', color: 'inherit', background: 'var(--panel)', border: '1px solid var(--line-2)' }} />
        </label>
      )}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        {visibleDraft && (
          <>
            <button type="button" style={ghostButton} disabled={busy} onClick={() => {
              setSaveStatus(null);
              setEditedText(editing ? null : visibleDraft.draft);
            }}>
              {editing ? 'Cancel edit' : 'Edit review'}
            </button>
            <button type="button" style={ghostButton} disabled={busy || editing || !visibleDraft.draft.trim()} onClick={() => saveReview(true)}>Save review</button>
            <button type="button" style={primaryButton} disabled={busy || (editing && !editedText.trim())} onClick={() => saveReview(false)}>Save draft</button>
          </>
        )}
      </div>
      <div className="task-actions">
        <button type="button" style={ghostButton} aria-expanded={historyOpen} onClick={() => setHistoryOpen((open) => !open)}>Past reviews</button>
        {!imported && legacy.some(({ draft, entries }) => draft || entries.length > 0) && (
          <button type="button" style={ghostButton} disabled={busy} onClick={() => importReviews.mutate()}>Import saved reviews</button>
        )}
      </div>
      {historyOpen && (
        <section aria-label="Review history">
          <h2 className="hf">Review history</h2>
          {history.isPending && <p>Loading past reviews…</p>}
          {history.isError && <p role="alert">Could not load past reviews. <button type="button" style={ghostButton} onClick={() => void history.refetch()}>Retry history</button></p>}
          {history.isSuccess && history.data.length === 0 && <p>No past reviews yet.</p>}
          {history.data?.map((review) => (
            <details key={review.id}>
              <summary>{formatRange(review.rangeStart, review.rangeEnd, timeZone)} · {new Date(review.finalizedAt).toLocaleString()}</summary>
              <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{review.draft}</p>
              {review.decisions && <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{review.decisions}</p>}
              <button type="button" style={ghostButton} onClick={() => exportReview(review)}>Export Markdown</button>
            </details>
          ))}
        </section>
      )}
      {saved.isError && <p role="alert">Could not load the saved draft. <button type="button" style={ghostButton} onClick={() => void saved.refetch()}>Retry draft</button></p>}
      {saveStatus === 'finalized' && <p role="status">Review finalized and saved</p>}
      {saveStatus === 'saved' && <p role="status">Draft saved</p>}
      {saveStatus === 'imported' && <p role="status">Saved reviews imported</p>}
      {saveStatus === 'error' && <p role="alert">Could not save reviews. Check the API connection and try again.</p>}

    </div>
  );
}
