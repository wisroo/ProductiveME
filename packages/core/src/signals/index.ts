import type { RegistryEntry, Signal, Snapshot } from '../types.js';
import { careerLifeImbalance } from './careerLifeImbalance.js';
import { connectorBlocked } from './connectorBlocked.js';
import { domainNeglected } from './domainNeglected.js';
import { reviewDue } from './reviewDue.js';

export * from './careerLifeImbalance.js';
export * from './connectorBlocked.js';
export * from './domainNeglected.js';
export * from './helpers.js';
export * from './reviewDue.js';

export function computeSignals(entries: RegistryEntry[], snapshots: Snapshot[], now: string): Signal[] {
  return [
    ...connectorBlocked(entries, snapshots),
    ...reviewDue(entries, snapshots, now),
    ...domainNeglected(entries, snapshots, now),
    ...careerLifeImbalance(entries, snapshots, now),
  ];
}
