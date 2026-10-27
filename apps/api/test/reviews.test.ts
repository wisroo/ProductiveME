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
});
