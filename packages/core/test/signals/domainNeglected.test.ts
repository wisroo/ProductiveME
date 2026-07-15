import { describe, expect, it } from 'vitest';
import type { RegistryEntry, Snapshot } from '../../src/types.js';
import { domainNeglected } from '../../src/signals/domainNeglected.js';

const NOW = '2026-07-10T00:00:00Z';

const entry = (id: string, domain: RegistryEntry['domain']): RegistryEntry => ({
  id,
  name: id,
  kind: 'project',
  domain,
  locator: `file:///${id}`,
  connector: 'static-file',
});

const snapWithActivity = (entryId: string, ts: string): Snapshot => ({
  entryId,
  fetchedAt: NOW,
  status: 'ok',
  items: [{ title: 'activity', timestamp: ts }],
});

describe('domainNeglected', () => {
  it('warns for a domain with no recent activity', () => {
    const signals = domainNeglected(
      [entry('life-exercise', 'life')],
      [snapWithActivity('life-exercise', '2026-06-01T00:00:00Z')],
      NOW,
    );
    expect(signals).toHaveLength(1);
    expect(signals[0]).toMatchObject({ severity: 'warning', domain: 'life' });
  });

  it('stays quiet for a domain with recent activity', () => {
    const signals = domainNeglected(
      [entry('life-exercise', 'life')],
      [snapWithActivity('life-exercise', '2026-07-08T00:00:00Z')],
      NOW,
    );
    expect(signals).toHaveLength(0);
  });

  it('warns for a domain whose entries have no activity at all', () => {
    const signals = domainNeglected([entry('life-exercise', 'life')], [], NOW);
    expect(signals).toHaveLength(1);
  });

  it('skips domains with no registry entries', () => {
    const signals = domainNeglected([entry('life-exercise', 'life')], [], NOW);
    expect(signals.every((signal) => signal.domain === 'life')).toBe(true);
  });

  it('respects a custom threshold', () => {
    const signals = domainNeglected(
      [entry('life-exercise', 'life')],
      [snapWithActivity('life-exercise', '2026-07-08T00:00:00Z')],
      NOW,
      1,
    );
    expect(signals).toHaveLength(1);
  });
});
