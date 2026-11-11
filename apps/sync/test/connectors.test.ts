import { mkdtemp, mkdir, rm, symlink, utimes, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import type { RegistryEntry } from '@productiveme/core';
import { createConnectors } from '../src/connectors.js';

const entry = (connector: string, locator: string): RegistryEntry => ({ id: 'sample', name: 'Sample', kind: 'tool', domain: 'career', locator, connector });
const fixture = (path: string) => writeFile(path, JSON.stringify({ entryId: 'fixture', fetchedAt: '2026-10-01T00:00:00Z', status: 'ok', items: [{ title: 'fixture item' }] }));
let tempDir: string;

afterEach(async () => { if (tempDir) await rm(tempDir, { recursive: true, force: true }); });

describe('source connectors', () => {
  it('loads a static Snapshot fixture from a path or file URL', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'productiveme-connectors-'));
    const path = join(tempDir, 'snapshot.json');
    await fixture(path);
    const connectors = createConnectors();
    const snapshot = await connectors.get('static-file')?.load(entry('static-file', new URL(`file://${path}`).href));
    expect(snapshot).toMatchObject({ entryId: 'sample', status: 'ok', items: [{ title: 'fixture item' }] });
  });

  it('lists only immediate, non-symlink children and uses their modification times', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'productiveme-connectors-'));
    const folder = join(tempDir, 'folder');
    await mkdir(join(folder, 'nested'), { recursive: true });
    const file = join(folder, 'note.md');
    await writeFile(file, 'note');
    await writeFile(join(folder, 'nested', 'hidden.md'), 'hidden');
    const external = join(tempDir, 'external.md');
    await writeFile(external, 'outside');
    await symlink(external, join(folder, 'linked.md'));
    await utimes(file, new Date('2026-10-25T00:00:00Z'), new Date('2026-10-25T00:00:00Z'));
    const snapshot = await createConnectors().get('local-folder')?.load(entry('local-folder', folder));
    expect(snapshot?.items).toHaveLength(2);
    expect(snapshot?.items.map(({ title }) => title).sort()).toEqual(['nested', 'note.md']);
    expect(snapshot?.items.find(({ title }) => title === 'note.md')?.timestamp).toBe('2026-10-25T00:00:00.000Z');
  });

  it('maps GitHub repository metadata and recent events using read-only REST requests', async () => {
    const requests: Array<{ url: string; authorization: string | null }> = [];
    const fetchImpl = async (input: string | URL | Request, init?: RequestInit) => {
      requests.push({ url: String(input), authorization: new Headers(init?.headers).get('authorization') });
      return new Response(JSON.stringify(requests.length === 1
        ? { full_name: 'owner/repo', description: 'Description', html_url: 'https://github.com/owner/repo', pushed_at: '2026-10-25T00:00:00Z' }
        : [{ type: 'PushEvent', created_at: '2026-10-26T00:00:00Z', repo: { name: 'owner/repo' } }]), { status: 200 });
    };
    const snapshot = await createConnectors({ fetchImpl, githubToken: 'test-secret' }).get('github')?.load(entry('github', 'https://github.com/owner/repo'));
    expect(snapshot?.items).toEqual([
      { title: 'owner/repo', detail: 'Description', timestamp: '2026-10-25T00:00:00Z', link: 'https://github.com/owner/repo' },
      { title: 'PushEvent', detail: 'owner/repo', timestamp: '2026-10-26T00:00:00Z', link: 'https://github.com/owner/repo' },
    ]);
    expect(requests).toEqual([
      { url: 'https://api.github.com/repos/owner/repo', authorization: 'Bearer test-secret' },
      { url: 'https://api.github.com/repos/owner/repo/events?per_page=10', authorization: 'Bearer test-secret' },
    ]);
  });

  it('maps a shared Notion page to a snapshot without fetching its body', async () => {
    const id = '0123456789abcdef0123456789abcdef';
    const link = `https://www.notion.so/Study-${id}`;
    const fetchImpl = async (input: string | URL | Request, init?: RequestInit) => {
      expect(String(input)).toBe(`https://api.notion.com/v1/pages/${id}`);
      expect(new Headers(init?.headers).get('authorization')).toBe('Bearer test-token');
      expect(init?.redirect).toBe('error');
      return Response.json({
        object: 'page', url: link, last_edited_time: '2026-10-25T00:00:00.000Z',
        properties: { title: { type: 'title', title: [{ plain_text: 'Study' }, { plain_text: ' notes' }] } },
      });
    };
    const connector = createConnectors({ fetchImpl, notionToken: 'test-token' }).get('notion');
    expect(await connector?.load(entry('notion', link))).toMatchObject({
      status: 'ok', items: [{ title: 'Study notes', timestamp: '2026-10-25T00:00:00.000Z', link }],
    });
  });

  it('reads paginated Notion database rows with a configured activity date', async () => {
    const id = '0123456789abcdef0123456789abcdef';
    const requests: unknown[] = [];
    const fetchImpl = async (input: string | URL | Request, init?: RequestInit) => {
      expect(String(input)).toBe(`https://api.notion.com/v1/data_sources/${id}/query`);
      expect(init?.method).toBe('POST');
      requests.push(JSON.parse(String(init?.body)));
      return Response.json({
        has_more: requests.length === 1,
        next_cursor: requests.length === 1 ? 'cursor' : null,
        results: [{
          object: 'page', url: `https://www.notion.so/${id}`, last_edited_time: '2026-10-25T00:00:00.000Z',
          properties: {
            Name: { type: 'title', title: [{ plain_text: 'Run' }] },
            Activity: { type: 'date', date: requests.length === 1 ? { start: '2026-10-21' } : null },
          },
        }],
      });
    };
    const connector = createConnectors({ fetchImpl, notionToken: 'test-token' }).get('notion-data-source');
    const snapshot = await connector?.load({ ...entry('notion-data-source', id), notionActivityDateProperty: 'Activity' });
    expect(snapshot?.status).toBe('ok');
    expect(snapshot?.items.map((item) => item.timestamp)).toEqual(['2026-10-21T00:00:00.000Z', '2026-10-25T00:00:00.000Z']);
    expect(requests[1]).toMatchObject({ start_cursor: 'cursor' });
  });

  it('does not include GitHub credentials or response bodies in saved errors', async () => {
    const fetchImpl = async () => new Response('test-secret private-provider-error', { status: 500 });
    const snapshot = await createConnectors({ fetchImpl, githubToken: 'test-secret' }).get('github')?.load(entry('github', 'https://github.com/owner/repo'));
    expect(snapshot?.status).toBe('error');
    expect(snapshot?.error).not.toContain('test-secret');
    expect(snapshot?.error).not.toContain('private-provider-error');
  });
});
