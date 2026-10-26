import type { RegistryEntry, Snapshot } from '@productiveme/core';
import { z } from 'zod';
import { writeSnapshot } from './store.js';

export interface Connector {
  load(entry: RegistryEntry): Promise<Snapshot>;
}

const snapshotSchema = z.object({
  entryId: z.string().min(1),
  fetchedAt: z.string().datetime({ offset: true }),
  status: z.enum(['ok', 'error']),
  items: z.array(z.object({
    title: z.string(),
    detail: z.string().optional(),
    timestamp: z.string().datetime({ offset: true }).optional(),
    link: z.string().url().optional(),
  }).strict()),
  error: z.string().optional(),
}).strict();

function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'connector failed';
  return /^unknown connector "[A-Za-z0-9._-]+"$/.test(message) ? message : 'connector failed';
}

function errorSnapshot(entryId: string, fetchedAt: string, error: string): Snapshot {
  return { entryId, fetchedAt, status: 'error', items: [], error };
}

export async function runSync(
  entries: RegistryEntry[],
  connectors: Map<string, Connector>,
  snapshotDir: string,
  now: () => Date = () => new Date(),
): Promise<Snapshot[]> {
  return Promise.all(entries.map(async (entry) => {
    const fetchedAt = now().toISOString();
    let snapshot: Snapshot;
    try {
      const connector = connectors.get(entry.connector);
      if (!connector) throw new Error(`unknown connector "${entry.connector}"`);
      const loaded = await connector.load(entry);
      const parsed = snapshotSchema.parse(loaded);
      if (parsed.entryId !== entry.id) throw new Error('connector returned a Snapshot for a different registry entry');
      snapshot = {
        ...parsed,
        fetchedAt,
        items: parsed.items.map((item) => ({
          ...item,
          ...(item.timestamp ? { timestamp: new Date(item.timestamp).toISOString() } : {}),
        })),
      };
    } catch (error) {
      snapshot = errorSnapshot(entry.id, fetchedAt, safeError(error));
    }

    try {
      await writeSnapshot(snapshotDir, snapshot);
      return snapshot;
    } catch (error) {
      return errorSnapshot(entry.id, fetchedAt, safeError(error));
    }
  }));
}
