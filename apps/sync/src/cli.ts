import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseRegistry } from '@productiveme/core';
import { createConnectors } from './connectors.js';
import { readConfiguredSources } from './registry-store.js';
import { runSync } from './sync.js';

export const DEFAULT_REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

export function parseSyncArgs(args: string[]): { root: string } {
  if (args.length === 1 && args[0] === 'run') return { root: DEFAULT_REPO_ROOT };
  if (args.length === 3 && args[0] === 'run' && args[1] === '--root' && args[2]) {
    return { root: resolve(args[2]) };
  }
  throw new Error('usage: pnpm sync run [--root <path>]');
}

export async function runSyncCommand(
  args: string[],
  now: () => Date = () => new Date(),
): Promise<{ total: number; errors: number }> {
  const { root } = parseSyncArgs(args);
  const base = parseRegistry(await readFile(join(root, 'registry.yaml'), 'utf8'));
  const statePath = process.env.PRODUCTIVEME_STATE_PATH ?? join(root, '.productiveme', 'state.sqlite');
  const entries = readConfiguredSources(base, statePath).filter(({ connector }) => connector !== 'link');
  const connectors = createConnectors({ githubToken: process.env.GITHUB_TOKEN, notionToken: process.env.NOTION_TOKEN });
  const snapshots = await runSync(entries, connectors, join(root, 'snapshots'), now);
  return { total: snapshots.length, errors: snapshots.filter((snapshot) => snapshot.status === 'error').length };
}
