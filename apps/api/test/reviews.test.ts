import { describe, expect, it } from 'vitest';
import { buildReviewPrompt, reviewRange } from '../src/reviews.js';

describe('review prompt context', () => {
  it('builds a bounded prompt from successful snapshot facts without locators', () => {
    const prompt = buildReviewPrompt('weekly', '2026-10-19T12:00:00.000Z', '2026-10-26T12:00:00.000Z', [
      { id: 'secret', name: 'Career notes', kind: 'folder', domain: 'career', locator: '/private/path', connector: 'local-folder' },
    ], [{ entryId: 'secret', fetchedAt: '2026-10-26T11:00:00.000Z', status: 'ok', items: [
      { title: 'Practice', detail: 'System design', timestamp: '2026-10-22T11:00:00.000Z' },
      { title: 'Old item', timestamp: '2026-10-10T11:00:00.000Z' },
    ] }], []);
    expect(prompt).toContain('Career notes');
    expect(prompt).toContain('Practice');
    expect(prompt).not.toContain('Old item');
    expect(prompt).not.toContain('/private/path');
    expect(prompt.length).toBeLessThan(12000);
  });

  it('uses a fixed UTC clock for weekly and calendar-month ranges', () => {
    expect(reviewRange('weekly', '2026-10-26T12:00:00.000Z')).toEqual({ start: '2026-10-19T12:00:00.000Z', end: '2026-10-26T12:00:00.000Z' });
    expect(reviewRange('monthly', '2026-10-26T12:00:00.000Z')).toEqual({ start: '2026-09-26T12:00:00.000Z', end: '2026-10-26T12:00:00.000Z' });
  });

  it('filters for period activity before limiting the number of sources', () => {
    const entries = Array.from({ length: 17 }, (_, index) => ({
      id: `source-${index + 1}`, name: `Source ${index + 1}`, kind: 'folder' as const,
      domain: 'career' as const, locator: `/private/${index + 1}`, connector: 'local-folder',
    }));
    const snapshots = entries.map((entry, index) => ({
      entryId: entry.id, fetchedAt: '2026-10-01T12:00:00.000Z', status: 'ok' as const,
      items: [{ title: index === 16 ? 'Current activity from seventeenth source' : `Old activity ${index + 1}`, timestamp: index === 16 ? '2026-10-22T12:00:00.000Z' : '2026-10-01T12:00:00.000Z' }],
    }));
    const prompt = buildReviewPrompt('weekly', '2026-10-19T12:00:00.000Z', '2026-10-26T12:00:00.000Z', entries, snapshots, []);
    expect(prompt).toContain('Current activity from seventeenth source');
    expect(prompt).not.toContain('Old activity 1');
  });

  it('preserves critical computed signals when snapshot facts fill the prompt budget', () => {
    const prompt = buildReviewPrompt('weekly', '2026-10-19T12:00:00.000Z', '2026-10-26T12:00:00.000Z', [
      { id: 'large', name: 'Large source', kind: 'folder', domain: 'career', locator: '/private/path', connector: 'local-folder' },
    ], [{ entryId: 'large', fetchedAt: '2026-10-26T11:00:00.000Z', status: 'ok', items: [{ title: 'snapshot '.repeat(500), detail: 'detail '.repeat(500) }] }], [
      { severity: 'blocked', domain: 'finance', message: 'BLOCKED_SIGNAL_FACT' },
      { severity: 'due', domain: 'life', message: 'DUE_SIGNAL_FACT' },
    ], 900);
    expect(prompt.length).toBeLessThanOrEqual(900);
    expect(prompt).toContain('BLOCKED_SIGNAL_FACT');
    expect(prompt).toContain('DUE_SIGNAL_FACT');
  });
});
