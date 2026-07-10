import { describe, expect, it } from 'vitest';
import type { RegistryEntry, Snapshot, SnapshotItem } from '../../src/types.js';
import { careerLifeImbalance } from '../../src/signals/careerLifeImbalance.js';

const NOW = '2026-07-10T00:00:00Z';
const RECENT = '2026-07-05T00:00:00Z';
const OLD = '2026-05-01T00:00:00Z';

const entry = (id: string, domain: RegistryEntry['domain']): RegistryEntry => ({
  id, name: id, kind: 'project', domain, locator: `file:///${id}`, connector: 'static-file',
});

const items = (count: number, ts: string): SnapshotItem[] =>
  Array.from({ length: count }, (_, i) => ({ title: `item-${i}`, timestamp: ts }));

const snap = (entryId: string, snapItems: SnapshotItem[]): Snapshot => ({
  entryId, fetchedAt: NOW, status: 'ok', items: snapItems,
});

describe('careerLifeImbalance', () => {
  it('warns when career activity dwarfs life activity', () => {
    const signals = careerLifeImbalance(
      [entry('c', 'career'), entry('l', 'life')],
      [snap('c', items(9, RECENT)), snap('l', items(2, RECENT))],
      NOW,
    );
    expect(signals).toHaveLength(1);
    expect(signals[0]).toMatchObject({ severity: 'warning', domain: 'life' });
    expect(signals[0]?.message).toContain('9');
    expect(signals[0]?.message).toContain('2');
  });

  it('warns when life activity is zero but career is active', () => {
    const signals = careerLifeImbalance(
      [entry('c', 'career'), entry('l', 'life')],
      [snap('c', items(5, RECENT))],
      NOW,
    );
    expect(signals).toHaveLength(1);
  });

  it('stays quiet under the minimum career volume', () => {
    const signals = careerLifeImbalance(
      [entry('c', 'career'), entry('l', 'life')],
      [snap('c', items(4, RECENT))],
      NOW,
    );
    expect(signals).toHaveLength(0);
  });

  it('stays quiet when the ratio is healthy', () => {
    const signals = careerLifeImbalance(
      [entry('c', 'career'), entry('l', 'life')],
      [snap('c', items(6, RECENT)), snap('l', items(4, RECENT))],
      NOW,
    );
    expect(signals).toHaveLength(0);
  });

  it('ignores items outside the window', () => {
    const signals = careerLifeImbalance(
      [entry('c', 'career'), entry('l', 'life')],
      [snap('c', items(9, OLD))],
      NOW,
    );
    expect(signals).toHaveLength(0);
  });
});
