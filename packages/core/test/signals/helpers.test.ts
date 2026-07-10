import { describe, expect, it } from 'vitest';
import type { Snapshot } from '../../src/types.js';
import { daysBetween, lastActivity, latestSnapshots } from '../../src/signals/helpers.js';

function snap(entryId: string, fetchedAt: string, overrides: Partial<Snapshot> = {}): Snapshot {
  return { entryId, fetchedAt, status: 'ok', items: [], ...overrides };
}

describe('latestSnapshots', () => {
  it('keeps only the newest snapshot per entry', () => {
    const older = snap('a', '2026-07-01T00:00:00Z');
    const newer = snap('a', '2026-07-05T00:00:00Z');
    const other = snap('b', '2026-07-02T00:00:00Z');
    const latest = latestSnapshots([older, newer, other]);
    expect(latest.get('a')).toBe(newer);
    expect(latest.get('b')).toBe(other);
    expect(latest.size).toBe(2);
  });
});

describe('lastActivity', () => {
  it('returns the max item timestamp', () => {
    const snapshot = snap('a', '2026-07-05T00:00:00Z', {
      items: [
        { title: 'old', timestamp: '2026-06-01T00:00:00Z' },
        { title: 'new', timestamp: '2026-07-04T00:00:00Z' },
        { title: 'undated' },
      ],
    });
    expect(lastActivity(snapshot)).toBe('2026-07-04T00:00:00Z');
  });

  it('returns undefined for undefined, error, or activity-less snapshots', () => {
    expect(lastActivity(undefined)).toBeUndefined();
    expect(lastActivity(snap('a', '2026-07-05T00:00:00Z', { status: 'error' }))).toBeUndefined();
    expect(lastActivity(snap('a', '2026-07-05T00:00:00Z'))).toBeUndefined();
  });
});

describe('daysBetween', () => {
  it('computes fractional days', () => {
    expect(daysBetween('2026-07-01T00:00:00Z', '2026-07-08T12:00:00Z')).toBeCloseTo(7.5);
  });
});
