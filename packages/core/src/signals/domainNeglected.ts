import { DOMAIN_IDS, type RegistryEntry, type Signal, type Snapshot } from '../types.js';
import { daysBetween, lastActivity, latestSnapshots } from './helpers.js';

export function domainNeglected(
  entries: RegistryEntry[],
  snapshots: Snapshot[],
  now: string,
  thresholdDays = 14,
): Signal[] {
  const latest = latestSnapshots(snapshots);
  const signals: Signal[] = [];
  for (const domain of DOMAIN_IDS) {
    const domainEntries = entries.filter((entry) => entry.domain === domain);
    if (domainEntries.length === 0) continue;
    let newest: string | undefined;
    for (const entry of domainEntries) {
      const activity = lastActivity(latest.get(entry.id));
      if (activity && (!newest || activity > newest)) newest = activity;
    }
    if (!newest || daysBetween(newest, now) > thresholdDays) {
      signals.push({
        severity: 'warning',
        domain,
        message: `No activity in ${domain} for over ${thresholdDays} days`,
        suggestedAction: `Pick one small ${domain} action this week`,
      });
    }
  }
  return signals;
}
