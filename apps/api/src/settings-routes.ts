import type { DatabaseSync } from 'node:sqlite';
import type { FastifyInstance } from 'fastify';
import type { ReviewPeriod } from './reviews.js';

const schema = {
  type: 'object', required: ['reviewDefault'],
  properties: { reviewDefault: { type: 'string', enum: ['weekly', 'monthly'] } },
} as const;

export function registerSettingsRoutes(app: FastifyInstance, db: DatabaseSync) {
  db.exec("CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK (id = 1), review_default TEXT NOT NULL CHECK (review_default IN ('weekly', 'monthly')))");
  app.get('/settings', { schema: { response: { 200: schema } } }, () => ({
    reviewDefault: db.prepare('SELECT review_default FROM settings WHERE id = 1').get()?.review_default ?? 'weekly',
  }));
  app.put<{ Body: { reviewDefault: ReviewPeriod } }>('/settings', { schema: { body: schema, response: { 200: schema } } }, ({ body }) => {
    db.prepare('INSERT INTO settings VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET review_default = excluded.review_default').run(body.reviewDefault);
    return body;
  });
}
