import type { RegistryEntry, Signal, Snapshot } from '../types.js';
import { daysBetween, latestSnapshots } from './helpers.js';

export interface ImbalanceOptions {
  windowDays?: number;
  ratio?: number;
  minCareerItems?: number;
}

export function careerLifeImbalance(
  entries: RegistryEntry[],
  snapshots: Snapshot[],
  now: string,
  { windowDays = 14, ratio = 3, minCareerItems = 5 }: ImbalanceOptions = {},
): Signal[] {
  const latest = latestSnapshots(snapshots);
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  let career = 0;
  let life = 0;
  for (const [entryId, snapshot] of latest) {
    const entry = byId.get(entryId);
    if (!entry || snapshot.status !== 'ok') continue;
    if (entry.domain !== 'career' && entry.domain !== 'life') continue;
    for (const item of snapshot.items) {
      const ageDays = item.timestamp ? daysBetween(item.timestamp, now) : undefined;
      if (ageDays === undefined || ageDays < 0 || ageDays > windowDays) continue;
      if (entry.domain === 'career') career += 1;
      else life += 1;
    }
  }
  const imbalanced = career >= minCareerItems && (life === 0 || career / life >= ratio);
  if (!imbalanced) return [];
  return [
    {
      severity: 'warning',
      domain: 'life',
      message: `Career activity (${career} items) is far outpacing Life (${life}) over the last ${windowDays} days`,
      suggestedAction: 'Protect one Life activity this week',
    },
  ];
}
