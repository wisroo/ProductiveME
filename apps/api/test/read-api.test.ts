import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

const fixtureRoot = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const directories: string[] = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true })));
});

async function fixtureApp(extraRegistry = '') {
  const directory = await mkdtemp(join(tmpdir(), 'productiveme-read-api-'));
  directories.push(directory);
  const registryPath = join(directory, 'registry.yaml');
  const snapshotDir = join(directory, 'snapshots');
  await cp(join(fixtureRoot, 'registry.yaml'), registryPath);
  if (extraRegistry) {
    await writeFile(registryPath, `${await readFile(registryPath, 'utf8')}${extraRegistry}`);
  }
  await cp(join(fixtureRoot, 'snapshots'), snapshotDir, { recursive: true });
  return {
    app: await buildApp({ registryPath, snapshotDir, now: () => '2026-10-26T12:00:00.000Z' }),
    snapshotDir,
    directory,
  };
}

describe('snapshot read API', () => {
  it('returns the latest valid snapshot per registered entry without losing other sources to malformed files', async () => {
    const { app, snapshotDir } = await fixtureApp();
    try {
      await mkdir(join(snapshotDir, 'career-notes'), { recursive: true });
      await writeFile(join(snapshotDir, 'career-notes', 'broken.json'), '{');
      const response = await app.inject({ method: 'GET', url: '/snapshots' });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([
        {
          entryId: 'career-notes', fetchedAt: '2026-10-25T09:00:00.000Z', status: 'ok',
          items: [
            { title: 'System design practice', detail: 'Queue tradeoffs', timestamp: '2026-10-25T08:30:00.000Z', link: 'https://example.test/notes/queue' },
            { title: 'Portfolio review', timestamp: '2026-10-24T08:30:00.000Z' },
          ],
        },
        { entryId: 'finance-ledger', fetchedAt: '2026-10-25T10:00:00.000Z', status: 'error', items: [], error: 'Finance export was unavailable' },
        { entryId: 'finance-budget', fetchedAt: '2026-10-24T09:00:00.000Z', status: 'ok', items: [{ title: 'October budget reviewed', timestamp: '2026-10-24T09:00:00.000Z' }] },
        { entryId: 'personal-photos', fetchedAt: '2026-10-26T12:00:00.000Z', status: 'error', items: [], error: 'No snapshots found' },
        { entryId: 'life-exercise', fetchedAt: '2026-10-01T09:00:00.000Z', status: 'ok', items: [{ title: 'Evening walk', timestamp: '2026-10-01T18:00:00.000Z' }] },
      ]);
    } finally {
      await app.close();
    }
  });

  it('filters by a valid domain and rejects an invalid domain query', async () => {
    const { app } = await fixtureApp();
    try {
      const filtered = await app.inject({ method: 'GET', url: '/snapshots?domain=career' });
      expect(filtered.statusCode).toBe(200);
      expect(filtered.json()).toHaveLength(1);
      expect(filtered.json()[0].entryId).toBe('career-notes');
      const invalid = await app.inject({ method: 'GET', url: '/snapshots?domain=careers' });
      expect(invalid.statusCode).toBe(400);
    } finally {
      await app.close();
    }
  });

  it('returns an error snapshot when files exist but none pass runtime validation', async () => {
    const { app, snapshotDir } = await fixtureApp();
    try {
      await mkdir(join(snapshotDir, 'personal-photos'), { recursive: true });
      await writeFile(join(snapshotDir, 'personal-photos', 'bad.json'), JSON.stringify({ entryId: 'wrong-id', fetchedAt: 'bad', status: 'ok', items: [] }));
      const response = await app.inject({ method: 'GET', url: '/snapshots?domain=personal-data' });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([{ entryId: 'personal-photos', fetchedAt: '2026-10-26T12:00:00.000Z', status: 'error', items: [], error: 'No valid snapshots found' }]);
    } finally {
      await app.close();
    }
  });

  it('does not let a registry entry escape the snapshot directory', async () => {
    const { app, directory } = await fixtureApp(`  - id: ../secrets
    name: Unsafe source
    kind: folder
    domain: personal-data
    locator: file:///fixture/secrets
    connector: local-folder
`);
    try {
      await mkdir(join(directory, 'secrets'));
      await writeFile(join(directory, 'secrets', '2026-10-26.json'), JSON.stringify({
        entryId: '../secrets', fetchedAt: '2026-10-26T11:00:00.000Z', status: 'ok',
        items: [{ title: 'Must not be read' }],
      }));
      const response = await app.inject({ method: 'GET', url: '/snapshots' });
      expect(response.statusCode).toBe(200);
      expect(response.json().find((snapshot: { entryId: string }) => snapshot.entryId === '../secrets')).toEqual({
        entryId: '../secrets', fetchedAt: '2026-10-26T12:00:00.000Z', status: 'error', items: [],
        error: 'Unsafe registry entry ID; snapshot source not read',
      });
      expect(response.json().find((snapshot: { entryId: string }) => snapshot.entryId === 'career-notes')?.status).toBe('ok');
    } finally {
      await app.close();
    }
  });
});

describe('signal and domain read APIs', () => {
  it('uses the injected clock when computing signals', async () => {
    const { app } = await fixtureApp();
    try {
      const response = await app.inject({ method: 'GET', url: '/signals' });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toContainEqual({
        severity: 'due', domain: 'life', entryId: 'life-exercise',
        message: '"Exercise log" is due for its weekly attention', suggestedAction: 'Review Exercise log',
      });
      expect(response.json()).toContainEqual({
        severity: 'blocked', domain: 'finance', entryId: 'finance-ledger',
        message: 'Connector "static-file" failed for "Finance ledger": Finance export was unavailable',
        suggestedAction: 'Check the static-file connector',
      });
    } finally {
      await app.close();
    }
  });

  it('compares item timestamps chronologically across timezone offsets', async () => {
    const { app, snapshotDir } = await fixtureApp();
    try {
      await writeFile(join(snapshotDir, 'career-notes', '2026-10-26-offset.json'), JSON.stringify({
        entryId: 'career-notes', fetchedAt: '2026-10-26T11:00:00.000Z', status: 'ok',
        items: [
          { title: 'Earlier instant', timestamp: '2026-10-19T14:00:00+03:00' },
          { title: 'Later instant', timestamp: '2026-10-19T13:00:00.000Z' },
        ],
      }));
      const snapshots = await app.inject({ method: 'GET', url: '/snapshots?domain=career' });
      expect(snapshots.json()[0].items.map((item: { timestamp: string }) => item.timestamp)).toEqual([
        '2026-10-19T11:00:00.000Z', '2026-10-19T13:00:00.000Z',
      ]);
      const signals = await app.inject({ method: 'GET', url: '/signals' });
      expect(signals.json()).not.toContainEqual(expect.objectContaining({ severity: 'due', entryId: 'career-notes' }));
    } finally {
      await app.close();
    }
  });

  it('returns all four domain rollups with per-source health, counts, and latest item activity', async () => {
    const { app } = await fixtureApp();
    try {
      const response = await app.inject({ method: 'GET', url: '/domains' });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([
        { domain: 'career', health: 'healthy', entryCount: 1, okCount: 1, errorCount: 0, itemCount: 2, latestActivityAt: '2026-10-25T08:30:00.000Z' },
        { domain: 'finance', health: 'degraded', entryCount: 2, okCount: 1, errorCount: 1, itemCount: 1, latestActivityAt: '2026-10-24T09:00:00.000Z' },
        { domain: 'personal-data', health: 'unavailable', entryCount: 1, okCount: 0, errorCount: 1, itemCount: 0, latestActivityAt: null },
        { domain: 'life', health: 'healthy', entryCount: 1, okCount: 1, errorCount: 0, itemCount: 1, latestActivityAt: '2026-10-01T18:00:00.000Z' },
      ]);
    } finally {
      await app.close();
    }
  });
});

describe('OpenAPI contract', () => {
  it('publishes every read route and response schema', async () => {
    const { app } = await fixtureApp();
    try {
      const response = await app.inject({ method: 'GET', url: '/openapi.json' });
      expect(response.statusCode).toBe(200);
      const document = response.json();
      expect(document.openapi).toBe('3.0.3');
      expect(Object.keys(document.paths)).toEqual(expect.arrayContaining(['/registry', '/snapshots', '/signals', '/domains']));
      expect(document.paths['/healthz'].get.responses['200'].content['application/json'].schema).toEqual({ type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['ok'] } } });
      expect(document.paths['/snapshots'].get.parameters[0].schema.enum).toEqual(['career', 'finance', 'personal-data', 'life']);
      expect(document.paths['/snapshots'].get.responses['200'].content['application/json'].schema.items.properties.fetchedAt.format).toBe('date-time');
      expect(document.paths['/domains'].get.responses['200'].content['application/json'].schema.items.properties.health.enum).toEqual(['healthy', 'degraded', 'unavailable']);
    } finally {
      await app.close();
    }
  });
});

describe('liveness API', () => {
  it('reports process liveness without depending on registry or snapshot state', async () => {
    const { app } = await fixtureApp();
    try {
      const response = await app.inject({ method: 'GET', url: '/healthz' });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ status: 'ok' });
    } finally {
      await app.close();
    }
  });
});
