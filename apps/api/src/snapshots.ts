import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DOMAIN_IDS, type DomainId, type RegistryEntry, type Snapshot } from '@productiveme/core';
import { z } from 'zod';

const isoDateTime = z.string().datetime({ offset: true });
const snapshotSchema = z.object({
  entryId: z.string().min(1),
  fetchedAt: isoDateTime,
  status: z.enum(['ok', 'error']),
  items: z.array(z.object({
    title: z.string(),
    detail: z.string().optional(),
    timestamp: isoDateTime.optional(),
    link: z.string().url().optional(),
  })),
  error: z.string().optional(),
});

async function latestForEntry(snapshotDir: string, entry: RegistryEntry): Promise<Snapshot> {
  let filenames: string[];
  try {
    filenames = (await readdir(join(snapshotDir, entry.id), { withFileTypes: true }))
      .filter((item) => item.isFile() && item.name.endsWith('.json'))
      .map((item) => item.name)
      .sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { entryId: entry.id, fetchedAt: '', status: 'error', items: [], error: 'No snapshots found' };
    }
    return { entryId: entry.id, fetchedAt: '', status: 'error', items: [], error: 'Snapshot source could not be read' };
  }

  if (filenames.length === 0) {
    return { entryId: entry.id, fetchedAt: '', status: 'error', items: [], error: 'No snapshots found' };
  }

  const valid: Array<{ filename: string; snapshot: Snapshot }> = [];
  for (const filename of filenames) {
    try {
      const data: unknown = JSON.parse(await readFile(join(snapshotDir, entry.id, filename), 'utf8'));
      const snapshot = snapshotSchema.parse(data);
      if (snapshot.entryId === entry.id) valid.push({ filename, snapshot });
    } catch {
      // Keep scanning; a bad file must not hide another valid snapshot.
    }
  }

  valid.sort((left, right) => {
    const timeDifference = Date.parse(right.snapshot.fetchedAt) - Date.parse(left.snapshot.fetchedAt);
    if (timeDifference !== 0) return timeDifference;
    return left.filename < right.filename ? -1 : left.filename > right.filename ? 1 : 0;
  });
  return valid[0]?.snapshot ?? {
    entryId: entry.id,
    fetchedAt: '',
    status: 'error',
    items: [],
    error: 'No valid snapshots found',
  };
}

export async function loadLatestSnapshots(
  snapshotDir: string,
  entries: RegistryEntry[],
  domain?: DomainId,
): Promise<Snapshot[]> {
  const selected = domain ? entries.filter((entry) => entry.domain === domain) : entries;
  return Promise.all(selected.map((entry) => latestForEntry(snapshotDir, entry)));
}

export interface DomainRollup {
  domain: DomainId;
  health: 'healthy' | 'degraded' | 'unavailable';
  entryCount: number;
  okCount: number;
  errorCount: number;
  itemCount: number;
  latestActivityAt: string | null;
}

export function summarizeDomains(entries: RegistryEntry[], snapshots: Snapshot[]): DomainRollup[] {
  const byEntry = new Map(snapshots.map((snapshot) => [snapshot.entryId, snapshot]));
  return DOMAIN_IDS.map((domain) => {
    const domainEntries = entries.filter((entry) => entry.domain === domain);
    const domainSnapshots = domainEntries.flatMap((entry) => {
      const snapshot = byEntry.get(entry.id);
      return snapshot ? [snapshot] : [];
    });
    const okCount = domainSnapshots.filter((snapshot) => snapshot.status === 'ok').length;
    const errorCount = domainEntries.length - okCount;
    const activities = domainSnapshots
      .filter((snapshot) => snapshot.status === 'ok')
      .flatMap((snapshot) => snapshot.items.map((item) => item.timestamp).filter((time): time is string => Boolean(time)))
      .sort((left, right) => Date.parse(right) - Date.parse(left));
    return {
      domain,
      health: domainEntries.length === 0 || okCount === 0 ? 'unavailable' : errorCount ? 'degraded' : 'healthy',
      entryCount: domainEntries.length,
      okCount,
      errorCount,
      itemCount: domainSnapshots.filter((snapshot) => snapshot.status === 'ok').reduce((count, snapshot) => count + snapshot.items.length, 0),
      latestActivityAt: activities[0] ?? null,
    };
  });
}
