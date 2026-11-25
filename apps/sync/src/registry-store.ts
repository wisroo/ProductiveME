import { existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import type { RegistryEntry } from '@productiveme/core';

export function initializeRegistryStore(db: DatabaseSync) {
  db.exec('CREATE TABLE IF NOT EXISTS registry_overrides (id TEXT PRIMARY KEY, payload TEXT)');
}

export function mergeRegistry(base: RegistryEntry[], db: DatabaseSync): RegistryEntry[] {
  const entries = new Map(base.map((entry) => [entry.id, entry]));
  const table = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'registry_overrides'").get();
  if (!table) return base;
  for (const { id, payload } of db.prepare('SELECT id, payload FROM registry_overrides ORDER BY rowid').all()) {
    if (typeof payload === 'string') entries.set(String(id), JSON.parse(payload) as RegistryEntry);
    else entries.delete(String(id));
  }
  return [...entries.values()];
}

export function readConfiguredSources(base: RegistryEntry[], statePath: string): RegistryEntry[] {
  if (!existsSync(statePath)) return base;
  const db = new DatabaseSync(statePath, { readOnly: true });
  try {
    db.exec('PRAGMA busy_timeout = 5000');
    return mergeRegistry(base, db);
  } finally {
    db.close();
  }
}
