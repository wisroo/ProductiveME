import { describe, expect, it } from 'vitest';
import type { RegistryEntry, Snapshot } from '../../src/types.js';
import { connectorBlocked } from '../../src/signals/connectorBlocked.js';

const ENTRY: RegistryEntry = {
  id: 'career-repo',
  name: 'Portfolio repo',
  kind: 'repo',
  domain: 'career',
  locator: 'https://github.com/example/portfolio',
  connector: 'github',
};

describe('connectorBlocked', () => {
  it('emits a blocked signal for an error snapshot', () => {
    const errorSnap: Snapshot = {
      entryId: 'career-repo',
      fetchedAt: '2026-07-10T00:00:00Z',
      status: 'error',
      items: [],
      error: 'HTTP 401',
    };
    const signals = connectorBlocked([ENTRY], [errorSnap]);
    expect(signals).toHaveLength(1);
    expect(signals[0]).toMatchObject({ severity: 'blocked', domain: 'career', entryId: 'career-repo' });
    expect(signals[0]?.message).toContain('github');
    expect(signals[0]?.message).toContain('HTTP 401');
  });

  it('uses only the latest snapshot per entry (recovered connector emits nothing)', () => {
    const errorSnap: Snapshot = { entryId: 'career-repo', fetchedAt: '2026-07-09T00:00:00Z', status: 'error', items: [], error: 'HTTP 500' };
    const okSnap: Snapshot = { entryId: 'career-repo', fetchedAt: '2026-07-10T00:00:00Z', status: 'ok', items: [] };
    expect(connectorBlocked([ENTRY], [errorSnap, okSnap])).toHaveLength(0);
  });

  it('ignores snapshots for unknown entries', () => {
    const orphan: Snapshot = { entryId: 'ghost', fetchedAt: '2026-07-10T00:00:00Z', status: 'error', items: [] };
    expect(connectorBlocked([ENTRY], [orphan])).toHaveLength(0);
  });
});
