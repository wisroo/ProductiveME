import { mkdir, mkdtemp, readFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { RegistryEntry, Snapshot } from '@productiveme/core';
import { runSync } from '../src/sync.js';
import { loadLatestSnapshots } from '../../api/src/snapshots.js';

const fetchedAt = '2026-10-26T04:00:00.000Z';
const entry = (id: string): RegistryEntry => ({ id, name: id, kind: 'tool', domain: 'career', locator: 'x', connector: 'test' });
const ok = (entryId: string): Snapshot => ({ entryId, fetchedAt, status: 'ok', items: [{ title: 'One' }] });

let tempDir: string;

afterEach(async () => {
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
});

describe('runSync', () => {
  it('runs connectors concurrently and stores API-readable snapshots despite an isolated failure', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'productiveme-sync-'));
    let active = 0;
    let maxActive = 0;
    const snapshots = await runSync([entry('one'), entry('two')], new Map([
      ['test', { load: async (value) => {
        active += 1;
        maxActive = Math.max(active, maxActive);
        await new Promise((resolve) => setTimeout(resolve, 10));
        active -= 1;
        if (value.id === 'two') throw new Error('source unavailable');
        return ok(value.id);
      } }],
    ]), join(tempDir, 'snapshots'), () => new Date(fetchedAt));

    expect(maxActive).toBe(2);
    expect(snapshots.map(({ status }) => status)).toEqual(['ok', 'error']);
    expect(snapshots[1]).toMatchObject({ entryId: 'two', fetchedAt, items: [], error: 'connector failed' });
    const saved = JSON.parse(await readFile(join(tempDir, 'snapshots', 'one', `${fetchedAt}.json`), 'utf8')) as Snapshot;
    expect(saved).toEqual(ok('one'));
    expect(await loadLatestSnapshots(join(tempDir, 'snapshots'), [entry('one')])).toEqual([saved]);
  });

  it('turns malformed connector output into valid per-entry error snapshots', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'productiveme-sync-'));
    const [snapshot] = await runSync([entry('one')], new Map([
      ['test', { load: async () => ({ ...ok('one'), fetchedAt: 'not a date' }) }],
    ]), join(tempDir, 'snapshots'), () => new Date(fetchedAt));
    expect(snapshot).toMatchObject({ entryId: 'one', fetchedAt, status: 'error', items: [] });
  });

  it('rejects snapshots for a different registry entry', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'productiveme-sync-'));
    const [snapshot] = await runSync([entry('one')], new Map([
      ['test', { load: async () => ok('wrong-id') }],
    ]), join(tempDir, 'snapshots'), () => new Date(fetchedAt));
    expect(snapshot).toMatchObject({ entryId: 'one', fetchedAt, status: 'error', items: [] });
  });

  it('sanitizes error text returned inside a Snapshot before exposing or saving it', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'productiveme-sync-'));
    const [snapshot] = await runSync([entry('one')], new Map([
      ['test', { load: async () => ({ ...ok('one'), status: 'error', items: [], error: 'Bearer test-secret provider body' }) }],
    ]), join(tempDir, 'snapshots'), () => new Date(fetchedAt));
    const saved = await readFile(join(tempDir, 'snapshots', 'one', `${fetchedAt}.json`), 'utf8');
    expect(snapshot?.error).toBe('connector failed');
    expect(saved).not.toContain('test-secret');
    expect(saved).not.toContain('provider body');
  });

  it('rejects unsafe entry IDs without writing outside the snapshot root', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'productiveme-sync-'));
    const [snapshot] = await runSync([entry('../escape')], new Map([
      ['test', { load: async () => ok('../escape') }],
    ]), join(tempDir, 'snapshots'), () => new Date(fetchedAt));
    expect(snapshot?.status).toBe('error');
    await expect(readFile(join(tempDir, 'escape', `${fetchedAt}.json`))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('refuses a symlinked entry output directory', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'productiveme-sync-'));
    const snapshots = join(tempDir, 'snapshots');
    const elsewhere = join(tempDir, 'elsewhere');
    await mkdir(snapshots);
    await mkdir(elsewhere);
    await symlink(elsewhere, join(snapshots, 'one'));
    const [snapshot] = await runSync([entry('one')], new Map([
      ['test', { load: async () => ok('one') }],
    ]), snapshots, () => new Date(fetchedAt));
    expect(snapshot).toMatchObject({ entryId: 'one', status: 'error' });
    expect(await readFile(join(elsewhere, `${fetchedAt}.json`)).catch(() => null)).toBeNull();
  });
});
