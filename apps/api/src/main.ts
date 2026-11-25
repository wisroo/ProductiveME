import { join, dirname } from 'node:path';
import { createConnectors } from '@productiveme/sync/connectors';
import { runSync } from '@productiveme/sync/run';
import { fileURLToPath } from 'node:url';
import { buildApp } from './app.js';
import { parseApiRuntimeConfig, registerGracefulShutdown } from './runtime.js';

const registryPath = fileURLToPath(new URL('../../../registry.yaml', import.meta.url));
const snapshotDir = join(dirname(registryPath), 'snapshots');
const retryEnabled = process.env.SOURCE_RETRY_ENABLED === '1';
const app = await buildApp({
  registryPath,
  snapshotDir,
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
