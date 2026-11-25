import { lstat, readdir, readFile, realpath } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RegistryEntry, Snapshot, SnapshotItem } from '@productiveme/core';
import { loadNotion, notionId } from './notion.js';
import type { Connector } from './sync.js';

type FetchImpl = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

interface ConnectorOptions {
  fetchImpl?: FetchImpl;
  githubToken?: string;
  notionToken?: string;
}

function errorSnapshot(entry: RegistryEntry, error: string): Snapshot {
  return { entryId: entry.id, fetchedAt: new Date().toISOString(), status: 'error', items: [], error };
}

function localPath(locator: string): string {
  if (locator.startsWith('file:')) return fileURLToPath(locator);
  if (locator.includes('://')) throw new Error('expected a local path or file URL');
  return resolve(locator);
}

async function staticFile(entry: RegistryEntry): Promise<Snapshot> {
  try {
    const data: unknown = JSON.parse(await readFile(localPath(entry.locator), 'utf8'));
    if (!data || typeof data !== 'object' || !('items' in data) || !Array.isArray(data.items)) {
      throw new Error('fixture is not a Snapshot');
    }
    return { ...(data as Snapshot), entryId: entry.id };
  } catch {
    return errorSnapshot(entry, 'static Snapshot fixture could not be read');
  }
}

async function localFolder(entry: RegistryEntry): Promise<Snapshot> {
  try {
    const directory = localPath(entry.locator);
    const children = await readdir(directory, { withFileTypes: true });
    const items: SnapshotItem[] = [];
    for (const child of children) {
      if (child.isSymbolicLink()) continue;
      const path = resolve(directory, child.name);
      const stat = await lstat(path);
      if (!stat.isFile() && !stat.isDirectory()) continue;
      items.push({ title: child.name, detail: stat.isDirectory() ? 'Directory' : 'File', timestamp: stat.mtime.toISOString() });
    }
    return { entryId: entry.id, fetchedAt: new Date().toISOString(), status: 'ok', items };
  } catch {
    return errorSnapshot(entry, 'local folder could not be read');
  }
}

function githubRepo(locator: string): string {
  let url: URL;
  try { url = new URL(locator); } catch { throw new Error('GitHub locator must be a repository URL'); }
  if (url.protocol !== 'https:' || url.hostname !== 'github.com') throw new Error('GitHub locator must use https://github.com');
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length !== 2) throw new Error('GitHub locator must identify owner/repository');
  return parts.map((part) => encodeURIComponent(part.replace(/\.git$/, ''))).join('/');
}

async function github(entry: RegistryEntry, fetchImpl: FetchImpl, token?: string): Promise<Snapshot> {
  try {
    const repository = githubRepo(entry.locator);
    const headers = new Headers({ accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28' });
    if (token) headers.set('authorization', `Bearer ${token}`);
    const request = async (url: string): Promise<unknown> => {
      const response = await fetchImpl(url, { headers, signal: AbortSignal.timeout(10_000) });
      if (!response.ok) throw new Error(`GitHub API returned HTTP ${response.status}`);
      return response.json();
    };
    const [repo, events] = await Promise.all([
      request(`https://api.github.com/repos/${repository}`),
      request(`https://api.github.com/repos/${repository}/events?per_page=10`),
    ]);
    if (!repo || typeof repo !== 'object' || !Array.isArray(events)) throw new Error('GitHub API returned invalid data');
    const metadata = repo as { full_name?: unknown; description?: unknown; html_url?: unknown; pushed_at?: unknown };
    if (typeof metadata.full_name !== 'string' || typeof metadata.html_url !== 'string' || typeof metadata.pushed_at !== 'string') {
      throw new Error('GitHub API returned invalid repository metadata');
    }
    const items: SnapshotItem[] = [{
      title: metadata.full_name,
      ...(typeof metadata.description === 'string' ? { detail: metadata.description } : {}),
      timestamp: metadata.pushed_at,
      link: metadata.html_url,
    }];
    for (const value of events.slice(0, 10)) {
      if (!value || typeof value !== 'object') continue;
      const event = value as { type?: unknown; created_at?: unknown; repo?: { name?: unknown } };
      if (typeof event.type !== 'string' || typeof event.created_at !== 'string') continue;
      items.push({
        title: event.type,
        ...(typeof event.repo?.name === 'string' ? { detail: event.repo.name } : {}),
        timestamp: event.created_at,
        link: metadata.html_url,
      });
    }
    return { entryId: entry.id, fetchedAt: new Date().toISOString(), status: 'ok', items };
  } catch (error) {
    return errorSnapshot(entry, error instanceof Error && error.message.startsWith('GitHub locator') ? error.message : 'GitHub repository could not be read');
  }
}

export async function normalizedConnectorLocator(connector: string, locator: string): Promise<string | undefined> {
  try {
    if (connector === 'link') {
      const url = new URL(locator);
      return url.protocol === 'https:' && !url.username && !url.password ? url.toString() : undefined;
    }
    if (connector === 'github') {
      const url = new URL(locator);
      if (url.username || url.password || url.port) return undefined;
      if (!/^\/[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+\/?$/.test(url.pathname)) return undefined;
      const repository = githubRepo(locator);
      return `https://github.com/${repository.toLowerCase()}`;
    }
    if (connector === 'notion' || connector === 'notion-data-source') return notionId(locator, connector === 'notion-data-source');
    if (connector === 'managed-folder') {
      const configured = process.env.SOURCE_FOLDER_ROOT;
      if (!configured || !isAbsolute(configured) || !isAbsolute(locator)) return undefined;
      const candidate = await realpath(locator);
      const root = await realpath(configured);
      const within = relative(root, candidate);
      if (within === '..' || within.startsWith(`..${sep}`) || isAbsolute(within)) return undefined;
      return (await lstat(candidate)).isDirectory() ? candidate : undefined;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export function createConnectors(options: ConnectorOptions = {}): Map<string, Connector> {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  return new Map<string, Connector>([
    ['static-file', { load: staticFile }],
    ['local-folder', { load: localFolder }],
    ['managed-folder', { load: async (entry) => {
      const locator = await normalizedConnectorLocator('managed-folder', entry.locator);
      return locator ? localFolder({ ...entry, locator }) : errorSnapshot(entry, 'local folder could not be read');
    } }],
    ['notion-data-source', { load: (entry: RegistryEntry) => loadNotion(entry, fetchImpl, options.notionToken) }],
    ['notion', { load: (entry: RegistryEntry) => loadNotion(entry, fetchImpl, options.notionToken) }],
    ['github', { load: (entry: RegistryEntry) => github(entry, fetchImpl, options.githubToken) }],
  ]);
}
