import { describe, expect, it } from 'vitest';
import type { RegistryEntry, Snapshot } from '../../src/types.js';
import { reviewDue } from '../../src/signals/reviewDue.js';

const NOW = '2026-07-10T00:00:00Z';

const entry = (overrides: Partial<RegistryEntry>): RegistryEntry => ({
  id: 'finance-snapshot',
  name: 'Monthly asset snapshot',
  kind: 'tool',
  domain: 'finance',
  locator: 'file:///finance',
  connector: 'static-file',
  cadence: 'monthly',
  ...overrides,
});

const okSnap = (entryId: string, itemTs: string): Snapshot => ({
  entryId,
  fetchedAt: NOW,
  status: 'ok',
  items: [{ title: 'entry', timestamp: itemTs }],
});

describe('reviewDue', () => {
  it('emits a due signal when the cadence window has passed', () => {
    const signals = reviewDue([entry({})], [okSnap('finance-snapshot', '2026-05-01T00:00:00Z')], NOW);
    expect(signals).toHaveLength(1);
    expect(signals[0]).toMatchObject({ severity: 'due', domain: 'finance', entryId: 'finance-snapshot' });
    expect(signals[0]?.message).toContain('monthly');
  });

  it('emits nothing when activity is within the window', () => {
    const signals = reviewDue([entry({})], [okSnap('finance-snapshot', '2026-07-01T00:00:00Z')], NOW);
    expect(signals).toHaveLength(0);
  });

  it('treats never-touched cadenced entries as due', () => {
    expect(reviewDue([entry({})], [], NOW)).toHaveLength(1);
  });

  it('ignores entries without a cadence', () => {
    expect(reviewDue([entry({ cadence: undefined })], [], NOW)).toHaveLength(0);
  });
});
