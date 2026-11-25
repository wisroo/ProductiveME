import { mkdir } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { createConnectors } from '@productiveme/sync/connectors';
import { runSync } from '@productiveme/sync/run';
import { fileURLToPath } from 'node:url';
import { buildApp } from './app.js';
import { parseApiRuntimeConfig, registerGracefulShutdown } from './runtime.js';

const registryPath = process.env.PRODUCTIVEME_REGISTRY_PATH
  ? resolve(process.env.PRODUCTIVEME_REGISTRY_PATH)
  : fileURLToPath(new URL('../../../registry.yaml', import.meta.url));
const snapshotDir = join(dirname(registryPath), 'snapshots');
const statePath = process.env.PRODUCTIVEME_STATE_PATH ?? join(dirname(registryPath), '.productiveme', 'state.sqlite');
await mkdir(dirname(statePath), { recursive: true });
const retryEnabled = process.env.SOURCE_RETRY_ENABLED === '1';
const connectors = createConnectors({ githubToken: process.env.GITHUB_TOKEN, notionToken: process.env.NOTION_TOKEN });
const app = await buildApp({
  registryPath,
  snapshotDir,
  statePath,
  ...(retryEnabled ? {
    async testSource(entry) {
      const connector = connectors.get(entry.connector);
      return (await connector?.load(entry))?.status === 'ok';
    },
    async retrySource(entry) {
      const [snapshot] = await runSync([entry], connectors, snapshotDir);
      if (!snapshot) throw new Error('Sync returned no snapshot');
      return snapshot;
    },
  } : {}),
});
const { host, port } = parseApiRuntimeConfig();
registerGracefulShutdown(app);
await app.listen({ port, host });
