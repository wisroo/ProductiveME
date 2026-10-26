import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_REPO_ROOT, parseSyncArgs, runSyncCommand } from '../src/cli.js';

let tempDir: string;

afterEach(async () => { if (tempDir) await rm(tempDir, { recursive: true, force: true }); });

describe('sync CLI', () => {
  it('accepts only the manual run command', () => {
    const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
    expect(DEFAULT_REPO_ROOT).toBe(resolve(packageDir, '../..'));
    expect(parseSyncArgs(['run']).root).toBe(resolve(packageDir, '../..'));
    expect(() => parseSyncArgs([])).toThrow('usage: pnpm sync run');
    expect(() => parseSyncArgs(['unexpected'])).toThrow('usage: pnpm sync run');
    expect(parseSyncArgs(['run', '--root', '/tmp/sync-root']).root).toBe('/tmp/sync-root');
  });

  it('loads a registry and writes a connector error Snapshot for an unknown connector', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'productiveme-cli-'));
    await writeFile(join(tempDir, 'registry.yaml'), `entries:\n  - id: sample\n    name: Sample\n    kind: tool\n    domain: career\n    locator: nowhere\n    connector: future-connector\n`);
    const result = await runSyncCommand(['run', '--root', tempDir], () => new Date('2026-10-26T04:00:00.000Z'));
    expect(result).toEqual({ total: 1, errors: 1 });
    const snapshot = JSON.parse(await readFile(join(tempDir, 'snapshots', 'sample', '2026-10-26T04:00:00.000Z.json'), 'utf8'));
    expect(snapshot).toMatchObject({ entryId: 'sample', fetchedAt: '2026-10-26T04:00:00.000Z', status: 'error', items: [] });
  });

  it('fails loudly when the registry is invalid', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'productiveme-cli-'));
    await writeFile(join(tempDir, 'registry.yaml'), 'entries: nope');
    await expect(runSyncCommand(['run', '--root', tempDir])).rejects.toThrow('invalid registry');
  });

  it('runs from the sync package directory while reading only the requested temporary registry', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'productiveme-cli-'));
    const fixture = join(tempDir, 'fixture.json');
    await writeFile(fixture, JSON.stringify({ entryId: 'sample', fetchedAt: '2026-10-01T00:00:00Z', status: 'ok', items: [] }));
    await writeFile(join(tempDir, 'registry.yaml'), `entries:\n  - id: sample\n    name: Sample\n    kind: tool\n    domain: career\n    locator: ${JSON.stringify(fixture)}\n    connector: static-file\n`);
    const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
    const output = execFileSync(process.execPath, ['--import', 'tsx', 'src/main.ts', 'run', '--root', tempDir], {
      cwd: packageDir,
      encoding: 'utf8',
    });
    expect(JSON.parse(output)).toEqual({ event: 'sync.completed', total: 1, ok: 1, errors: 0 });
    const [filename] = await readdir(join(tempDir, 'snapshots', 'sample'));
    const snapshot = JSON.parse(await readFile(join(tempDir, 'snapshots', 'sample', filename!), 'utf8'));
    expect(snapshot).toMatchObject({ entryId: 'sample', status: 'ok', items: [] });
  });
});
