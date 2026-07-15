import type { RegistryEntry, Signal, Snapshot } from '../types.js';
import { latestSnapshots } from './helpers.js';

export function connectorBlocked(entries: RegistryEntry[], snapshots: Snapshot[]): Signal[] {
  const latest = latestSnapshots(snapshots);
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const signals: Signal[] = [];
  for (const [entryId, snapshot] of latest) {
    const entry = byId.get(entryId);
    if (!entry || snapshot.status !== 'error') continue;
    signals.push({
      severity: 'blocked',
      domain: entry.domain,
      entryId,
      message: `Connector "${entry.connector}" failed for "${entry.name}": ${snapshot.error ?? 'unknown error'}`,
      suggestedAction: `Check the ${entry.connector} connector`,
    });
  }
  return signals;
}
