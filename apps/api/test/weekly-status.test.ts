import { expect, it } from 'vitest';
import { weeklyStatuses } from '../src/weekly-status.js';

it('prioritizes source failures before caps and compares open against done', () => {
  const tasks = [false, false, false, true].map((done, index) => ({
    domain: 'finance' as const, id: String(index), text: 'Check balance', done,
  }));
  const sources = [{ domain: 'finance' as const, id: 'bank', locator: '', connector: 'static-file', name: 'Bank export', kind: 'tool' as const }];
  const getStatus = (health: 'down' | 'idle', count: number) => weeklyStatuses(
    sources, [{ id: 'bank', status: health, lastGoodReadAt: null }], tasks.slice(count ? -count : tasks.length),
  ).find(({ domain }) => domain === 'finance')?.status;
  expect(getStatus('down', 4)).toBe('blocked');
  expect(getStatus('idle', 4)).toBe('overloaded');
  expect(getStatus('idle', 2)).toBe('on-track');
  expect(weeklyStatuses([], [], tasks.slice(0, 2)).find(({ domain }) => domain === 'finance')?.status).toBe('neglected');
});
