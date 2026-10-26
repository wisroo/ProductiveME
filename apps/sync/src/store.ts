import { lstat, mkdir, rename, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import type { Snapshot } from '@productiveme/core';

const SAFE_ENTRY_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

async function ensureRealDirectory(path: string, create: boolean): Promise<void> {
  if (create) await mkdir(path, { recursive: true });
  const stat = await lstat(path);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('snapshot destination is not a real directory');
}

export async function writeSnapshot(snapshotDir: string, snapshot: Snapshot): Promise<void> {
  if (!SAFE_ENTRY_ID.test(snapshot.entryId)) throw new Error('unsafe registry entry ID; snapshot was not written');

  await ensureRealDirectory(snapshotDir, true);
  const entryDir = join(snapshotDir, snapshot.entryId);
  try {
    await ensureRealDirectory(entryDir, false);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    await mkdir(entryDir);
    await ensureRealDirectory(entryDir, false);
  }

  const filename = `${snapshot.fetchedAt}.json`;
  const destination = join(entryDir, filename);
  const temporary = join(entryDir, `.${filename}.${randomUUID()}.tmp`);
  try {
    await writeFile(temporary, `${JSON.stringify(snapshot, null, 2)}\n`, { flag: 'wx' });
    await rename(temporary, destination);
  } catch (error) {
    const { unlink } = await import('node:fs/promises');
    await unlink(temporary).catch(() => undefined);
    throw error;
  }
}
