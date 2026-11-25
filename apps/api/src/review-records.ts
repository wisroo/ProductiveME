import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { FastifyInstance } from 'fastify';
import type { ReviewPeriod } from './reviews.js';

const period = { type: 'string', enum: ['weekly', 'monthly'] } as const;
const dateTime = { type: 'string', format: 'date-time' } as const;
const decisions = { type: 'string', maxLength: 6000 } as const;
const draftSchema = {
  type: 'object',
  required: ['period', 'rangeStart', 'rangeEnd', 'draft'],
  properties: { period, rangeStart: dateTime, rangeEnd: dateTime, draft: { type: 'string', minLength: 1, maxLength: 20000 }, decisions },
} as const;
const archiveInput = { ...draftSchema, properties: { ...draftSchema.properties, finalizedAt: dateTime } } as const;
const entrySchema = {
  type: 'object',
  required: [...draftSchema.required, 'id', 'finalizedAt'],
  properties: { ...archiveInput.properties, id: { type: 'string', format: 'uuid' } },
} as const;
const errorSchema = { type: 'object', required: ['code', 'message'], properties: { code: { type: 'string' }, message: { type: 'string' } } } as const;
const periodParam = { type: 'object', required: ['period'], properties: { period } } as const;

type Draft = { period: ReviewPeriod; rangeStart: string; rangeEnd: string; draft: string; decisions?: string };
type ArchiveInput = Draft & { finalizedAt?: string };
type Entry = Draft & { id: string; finalizedAt: string };

function normalizeDraft({ period, rangeStart, rangeEnd, draft, decisions }: Draft): Draft | undefined {
  const start = Date.parse(rangeStart);
  const end = Date.parse(rangeEnd);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start || !draft.trim()) return undefined;
  return {
    period, rangeStart: new Date(start).toISOString(), rangeEnd: new Date(end).toISOString(), draft,
    ...(decisions?.trim() ? { decisions: decisions.trim() } : {}),
  };
}

export function registerReviewRecords(app: FastifyInstance, db: DatabaseSync, now: () => string) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS review_drafts (period TEXT PRIMARY KEY, payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS review_entries (
      id TEXT PRIMARY KEY, period TEXT NOT NULL, finalized_at TEXT NOT NULL,
      content TEXT NOT NULL UNIQUE, payload TEXT NOT NULL
    );
  `);

  const readDraft = (period: ReviewPeriod): Draft | null => {
    const row = db.prepare('SELECT payload FROM review_drafts WHERE period = ?').get(period);
    return row ? JSON.parse(String(row.payload)) as Draft : null;
  };

  app.get<{ Params: { period: ReviewPeriod } }>('/review-drafts/:period', {
    schema: { params: periodParam, response: { 200: { type: 'object', required: ['draft'], properties: { draft: { anyOf: [draftSchema, { type: 'null' }] } } } } },
  }, (request) => ({ draft: readDraft(request.params.period) }));

  app.put<{ Params: { period: ReviewPeriod }; Querystring: { ifAbsent?: '1' }; Body: Draft }>('/review-drafts/:period', {
    schema: {
      params: periodParam,
      querystring: { type: 'object', properties: { ifAbsent: { type: 'string', enum: ['1'] } } },
      body: draftSchema, response: { 200: draftSchema, 400: errorSchema },
    },
  }, (request, reply) => {
    const draft = normalizeDraft(request.body);
    if (!draft || draft.period !== request.params.period) return reply.code(400).send({ code: 'INVALID_REVIEW', message: 'Enter a valid review and period.' });
    const payload = JSON.stringify(draft);
    if (request.query.ifAbsent) {
      db.prepare('INSERT OR IGNORE INTO review_drafts (period, payload) VALUES (?, ?)').run(draft.period, payload);
      return readDraft(draft.period) ?? draft;
    }
    db.prepare('INSERT INTO review_drafts (period, payload) VALUES (?, ?) ON CONFLICT(period) DO UPDATE SET payload = excluded.payload').run(draft.period, payload);
    return draft;
  });

  app.get<{ Querystring: { period: ReviewPeriod } }>('/review-entries', {
    schema: {
      querystring: { type: 'object', required: ['period'], properties: { period } },
      response: { 200: { type: 'array', items: entrySchema } },
    },
  }, ({ query }) => db.prepare('SELECT payload FROM review_entries WHERE period = ? ORDER BY finalized_at DESC, rowid DESC')
    .all(query.period).map((row) => JSON.parse(String(row.payload)) as Entry));

  app.post<{ Body: ArchiveInput }>('/review-entries', {
    schema: { body: archiveInput, response: { 200: entrySchema, 201: entrySchema, 400: errorSchema } },
  }, (request, reply) => {
    const normalized = normalizeDraft(request.body);
    const finalizedAt = new Date(request.body.finalizedAt ?? now());
    if (!normalized || !Number.isFinite(finalizedAt.valueOf())) return reply.code(400).send({ code: 'INVALID_REVIEW', message: 'Enter a valid review and period.' });
    const content = JSON.stringify(normalized);
    const entry = { ...normalized, id: randomUUID(), finalizedAt: finalizedAt.toISOString() };
    const result = db.prepare('INSERT OR IGNORE INTO review_entries (id, period, finalized_at, content, payload) VALUES (?, ?, ?, ?, ?)')
      .run(entry.id, entry.period, entry.finalizedAt, content, JSON.stringify(entry));
    if (result.changes) return reply.code(201).send(entry);
    const row = db.prepare('SELECT payload FROM review_entries WHERE content = ?').get(content);
    return JSON.parse(String(row?.payload)) as Entry;
  });
}
