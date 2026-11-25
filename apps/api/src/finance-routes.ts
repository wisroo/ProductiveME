import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { FastifyInstance } from 'fastify';

const date = { type: 'string', format: 'date' } as const;
const won = { type: 'integer', minimum: 0, maximum: 1_000_000_000_000 } as const;
const amounts = { cash: won, investments: won, savings: won, other: won } as const;
const fields = ['date', 'cash', 'investments', 'savings', 'other'] as const;
const snapshot = {
  type: 'object', required: ['id', 'total', ...fields],
  properties: { id: { type: 'string' }, date, ...amounts, total: { type: 'integer', minimum: 0 } },
} as const;
const error = { type: 'object', required: ['code', 'message'], properties: { code: { type: 'string' }, message: { type: 'string' } } } as const;
type RecordInput = { week: string; taskId?: string; date: string; cash: number; investments: number; savings: number; other: number };

export function registerFinanceRoutes(app: FastifyInstance, db: DatabaseSync) {
  db.exec(`CREATE TABLE IF NOT EXISTS finance_snapshots (
    date TEXT PRIMARY KEY, id TEXT NOT NULL, payload TEXT NOT NULL
  )`);
  app.get('/finance/snapshots', { schema: { response: { 200: { type: 'array', items: snapshot } } } }, () =>
    db.prepare('SELECT payload FROM finance_snapshots ORDER BY date DESC').all().map(({ payload }) => JSON.parse(String(payload)) as unknown),
  );

  app.post<{ Body: RecordInput }>('/finance/snapshots', {
    schema: {
      body: {
        type: 'object', required: ['week', ...fields], additionalProperties: false,
        properties: { date, week: date, ...amounts, taskId: { type: 'string', format: 'uuid' } },
      },
      response: { 200: snapshot, 201: snapshot, 400: error, 409: error },
    },
  }, ({ body }, reply) => {
    const { week, taskId, date, cash, investments, savings, other } = body;
    if (new Date(`${week}T00:00:00Z`).getUTCDay() !== 1) {
      return reply.code(400).send({ code: 'INVALID_WEEK', message: 'Week must start on a Monday.' });
    }
    db.exec('BEGIN IMMEDIATE');
    try {
      const candidates = db.prepare(`SELECT id, payload FROM tasks WHERE week = ? AND domain = 'finance' AND deleted = 0
        AND json_extract(payload, '$.kind') = 'snapshot' AND json_extract(payload, '$.done') = 0 ORDER BY rowid`).all(week);
      const target = taskId ? candidates.find(({ id }) => id === taskId) : candidates.length === 1 ? candidates[0] : undefined;
      if ((taskId && !target) || (!taskId && candidates.length > 1)) {
        db.exec('ROLLBACK');
        return reply.code(409).send({ code: 'SNAPSHOT_TASK_CONFLICT', message: 'Select an unfinished Finance snapshot task for this week.' });
      }
      const existing = db.prepare('SELECT id FROM finance_snapshots WHERE date = ?').get(date);
      const data = { id: existing ? String(existing.id) : randomUUID(), date, cash, investments, savings, other, total: cash + investments + savings + other };
      db.prepare(`INSERT INTO finance_snapshots (date, id, payload) VALUES (?, ?, ?)
        ON CONFLICT(date) DO UPDATE SET payload = excluded.payload`).run(date, data.id, JSON.stringify(data));
      if (target) db.prepare("UPDATE tasks SET payload = json_set(payload, '$.done', json('true')) WHERE id = ?").run(String(target.id));
      db.exec('COMMIT');
      return reply.code(existing ? 200 : 201).send(data);
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  });
}
