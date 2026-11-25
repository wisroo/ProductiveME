import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { readConfiguredSources } from '@productiveme/sync/registry';

it('shares source registration with Sync, refreshes without restart, and keeps snapshots when removing a source', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'productiveme-registry-write-'));
  const registryPath = join(dir, 'registry.yaml');
  const statePath = join(dir, 'state.sqlite');
  await writeFile(registryPath, 'entries: []\n');
  const app = await buildApp({ registryPath, statePath });
  try {
    const source = { name: 'Portfolio', connector: 'github', domain: 'career', locator: 'https://github.com/example/portfolio' };
    const invalid = await app.inject({ method: 'POST', url: '/sources', payload: { ...source, locator: 'https://unrelated.example/owner/repo' } });
    expect(invalid.statusCode).toBe(400);
    const added = await app.inject({ method: 'POST', url: '/sources', payload: source });
    expect(added.statusCode).toBe(201);
    const { id } = added.json() as { id: string };
    expect((await app.inject('/registry')).json()).toEqual([expect.objectContaining({ id, name: 'Portfolio' })]);
    expect(readConfiguredSources([], statePath)).toEqual([expect.objectContaining({ id, connector: 'github' })]);
    const snapshotDir = join(dir, 'snapshots', id);
    await mkdir(snapshotDir, { recursive: true });
    const savedSnapshot = join(snapshotDir, 'previous.json');
    await writeFile(savedSnapshot, '{}');
    const removed = await app.inject({ method: 'DELETE', url: `/sources/${id}` });
    expect(removed.statusCode).toBe(204);
    expect((await app.inject('/registry')).json()).toEqual([]);
    expect(readConfiguredSources([], statePath)).toEqual([]);
    expect(await readFile(savedSnapshot, 'utf8')).toBe('{}');
    const link = await app.inject({ method: 'POST', url: '/sources', payload: {
      name: 'Workspace', connector: 'link', domain: 'tools', locator: 'https://example.test/workspace',
    } });
    expect(link.statusCode).toBe(201);
    const alerts = await app.inject('/signals');
    expect(alerts.json()).toEqual([]);
    expect((await app.inject('/domains')).json()).toHaveLength(4);
  } finally {
    await app.close();
    await rm(dir, { recursive: true, force: true });
  }
});
