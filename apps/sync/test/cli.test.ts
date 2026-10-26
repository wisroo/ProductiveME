import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { parseSyncArgs, runSyncCommand } from '../src/cli.js';

let tempDir: string;

afterEach(async () => { if (tempDir) await rm(tempDir, { recursive: true, force: true }); });

describe('sync CLI', () => {
  it('accepts only the manual run command', () => {
    expect(() => parseSyncArgs(['run'])).not.toThrow();
    expect(() => parseSyncArgs([])).toThrow('usage: pnpm sync run');
    expect(() => parseSyncArgs(['unexpected'])).toThrow('usage: pnpm sync run');
  });

  it('loads a registry and writes a connector error Snapshot for an unknown connector', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'productiveme-cli-'));
    await writeFile(join(tempDir, 'registry.yaml'), `entries:\n  - id: sample\n    name: Sample\n    kind: tool\n    domain: career\n    locator: nowhere\n    connector: future-connector\n`);
    const result = await runSyncCommand(['run'], tempDir, () => new Date('2026-10-26T04:00:00.000Z'));
    expect(result).toEqual({ total: 1, errors: 1 });
    const snapshot = JSON.parse(await readFile(join(tempDir, 'snapshots', 'sample', '2026-10-26T04:00:00.000Z.json'), 'utf8'));
    expect(snapshot).toMatchObject({ entryId: 'sample', fetchedAt: '2026-10-26T04:00:00.000Z', status: 'error', items: [] });
  });

  it('fails loudly when the registry is invalid', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'productiveme-cli-'));
    await writeFile(join(tempDir, 'registry.yaml'), 'entries: nope');
    await expect(runSyncCommand(['run'], tempDir)).rejects.toThrow('invalid registry');
  });
});
