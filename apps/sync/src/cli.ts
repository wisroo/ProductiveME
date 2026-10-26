import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseRegistry } from '@productiveme/core';
import { createConnectors } from './connectors.js';
import { runSync } from './sync.js';

export function parseSyncArgs(args: string[]): void {
  if (args.length !== 1 || args[0] !== 'run') throw new Error('usage: pnpm sync run');
}

export async function runSyncCommand(
  args: string[],
  cwd: string,
  now: () => Date = () => new Date(),
): Promise<{ total: number; errors: number }> {
  parseSyncArgs(args);
  const entries = parseRegistry(await readFile(join(cwd, 'registry.yaml'), 'utf8'));
  const snapshots = await runSync(entries, createConnectors({ githubToken: process.env.GITHUB_TOKEN }), join(cwd, 'snapshots'), now);
  return { total: snapshots.length, errors: snapshots.filter((snapshot) => snapshot.status === 'error').length };
}
