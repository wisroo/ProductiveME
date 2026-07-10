import type { Cadence, RegistryEntry, Signal, Snapshot } from '../types.js';
import { daysBetween, lastActivity, latestSnapshots } from './helpers.js';

export const CADENCE_DAYS: Record<Cadence, number> = {
  weekly: 7,
  monthly: 31,
  quarterly: 92,
};

export function reviewDue(entries: RegistryEntry[], snapshots: Snapshot[], now: string): Signal[] {
  const latest = latestSnapshots(snapshots);
  const signals: Signal[] = [];
  for (const entry of entries) {
    if (!entry.cadence) continue;
    const activity = lastActivity(latest.get(entry.id));
    const overdue = !activity || daysBetween(activity, now) > CADENCE_DAYS[entry.cadence];
    if (overdue) {
      signals.push({
        severity: 'due',
        domain: entry.domain,
        entryId: entry.id,
        message: `"${entry.name}" is due for its ${entry.cadence} attention`,
        suggestedAction: `Review ${entry.name}`,
      });
    }
  }
  return signals;
}
