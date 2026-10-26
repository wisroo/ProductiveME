import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { buildApp } from '../src/app.js';

const projectRoot = resolve(process.cwd(), '../..');
const app = await buildApp({
  registryPath: resolve(projectRoot, 'registry.yaml'),
  snapshotDir: resolve(projectRoot, 'apps/api/test/fixtures/snapshots'),
});
try {
  await app.ready();
  const openapi = app.swagger();
  await writeFile(resolve(process.cwd(), 'openapi.json'), `${JSON.stringify(openapi, null, 2)}\n`);
  await mkdir(resolve(projectRoot, 'packages/api-client/src'), { recursive: true });
} finally {
  await app.close();
}
