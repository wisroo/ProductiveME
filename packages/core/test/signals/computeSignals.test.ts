import { describe, expect, it } from 'vitest';
import type { RegistryEntry, Snapshot } from '../../src/types.js';
import { computeSignals } from '../../src/signals/index.js';

const NOW = '2026-07-10T00:00:00Z';

const ENTRIES: RegistryEntry[] = [
  {
    id: 'finance-snapshot',
    name: 'Monthly asset snapshot',
    kind: 'tool',
    domain: 'finance',
    locator: 'file:///finance',
    connector: 'static-file',
    cadence: 'monthly',
  },
  {
    id: 'career-repo',
    name: 'Portfolio repo',
    kind: 'repo',
    domain: 'career',
    locator: 'https://github.com/example/portfolio',
    connector: 'github',
  },
];

const SNAPSHOTS: Snapshot[] = [
  { entryId: 'career-repo', fetchedAt: NOW, status: 'error', items: [], error: 'HTTP 401' },
];

describe('computeSignals', () => {
  it('aggregates all rules with blocked signals first', () => {
    const signals = computeSignals(ENTRIES, SNAPSHOTS, NOW);
    const severities = signals.map((signal) => signal.severity);
    expect(severities[0]).toBe('blocked'); // github connector down
    expect(severities).toContain('due'); // finance snapshot never touched
    expect(severities).toContain('warning'); // both domains inactive
  });

  it('returns an empty array for an empty registry', () => {
    expect(computeSignals([], [], NOW)).toEqual([]);
  });
});
