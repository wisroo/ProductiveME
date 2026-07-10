import type { Snapshot } from '../types.js';

export function latestSnapshots(snapshots: Snapshot[]): Map<string, Snapshot> {
  const latest = new Map<string, Snapshot>();
  for (const snapshot of snapshots) {
    const current = latest.get(snapshot.entryId);
    if (!current || snapshot.fetchedAt > current.fetchedAt) {
      latest.set(snapshot.entryId, snapshot);
    }
  }
  return latest;
}

export function lastActivity(snapshot: Snapshot | undefined): string | undefined {
  if (!snapshot || snapshot.status !== 'ok') return undefined;
  let max: string | undefined;
  for (const item of snapshot.items) {
    if (item.timestamp && (!max || item.timestamp > max)) max = item.timestamp;
  }
  return max;
}

export function daysBetween(fromIso: string, toIso: string): number {
  return (new Date(toIso).getTime() - new Date(fromIso).getTime()) / 86_400_000;
}
