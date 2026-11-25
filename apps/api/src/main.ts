import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { createConnectors } from '@productiveme/sync/connectors';
import { runSync } from '@productiveme/sync/run';
import { fileURLToPath } from 'node:url';
import { buildApp } from './app.js';
import { parseApiRuntimeConfig, registerGracefulShutdown } from './runtime.js';

const registryPath = fileURLToPath(new URL('../../../registry.yaml', import.meta.url));
const snapshotDir = join(dirname(registryPath), 'snapshots');
const statePath = process.env.PRODUCTIVEME_STATE_PATH ?? join(dirname(registryPath), '.productiveme', 'state.sqlite');
await mkdir(dirname(statePath), { recursive: true });
const retryEnabled = process.env.SOURCE_RETRY_ENABLED === '1';
const app = await buildApp({
  registryPath,
  snapshotDir,
  statePath,
  ...(retryEnabled ? {
    async retrySource(entry) {
      const connectors = createConnectors({ githubToken: process.env.GITHUB_TOKEN, notionToken: process.env.NOTION_TOKEN });
      const [snapshot] = await runSync([entry], connectors, snapshotDir);
      if (!snapshot) throw new Error('Sync returned no snapshot');
      return snapshot;
    },
  } : {}),
});
const { host, port } = parseApiRuntimeConfig();
registerGracefulShutdown(app);
await app.listen({ port, host });
