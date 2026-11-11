import type { RegistryEntry, Snapshot, SnapshotItem } from '@productiveme/core';
import { z } from 'zod';

const idPattern = /(?:^|-)([a-f0-9]{32}|[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/i;
const titleSchema = z.object({ type: z.literal('title'), title: z.array(z.object({ plain_text: z.string() })) });
const dateSchema = z.object({ type: z.literal('date'), date: z.object({
  start: z.union([z.string().date(), z.string().datetime({ offset: true })]),
}) });
const statusSchema = z.object({ type: z.literal('status'), status: z.object({ name: z.string() }) });
const pageSchema = z.object({
  object: z.literal('page'),
  url: z.string().url().refine((url) => url.startsWith('https://')),
  last_edited_time: z.string().datetime({ offset: true }),
  properties: z.record(z.unknown()),
});
const querySchema = z.object({
  results: z.array(pageSchema),
  has_more: z.boolean(),
  next_cursor: z.string().nullable(),
});

function notionId(locator: string, dataSource: boolean): string | undefined {
  const bareId = locator.match(idPattern)?.[1];
  if (bareId === locator) return bareId?.replaceAll('-', '');
  if (dataSource) return;
  const url = URL.parse(locator);
  if (!url || url.protocol !== 'https:' || url.username || url.password || url.port) return;
  if (!['notion.so', 'www.notion.so'].includes(url.hostname) && !url.hostname.endsWith('.notion.site')) return;
  return url.pathname.split('/').filter(Boolean).at(-1)?.match(idPattern)?.[1]?.replaceAll('-', '');
}

function pageItem(page: z.infer<typeof pageSchema>, entry: RegistryEntry): SnapshotItem {
  let title = entry.name;
  let detail: string | undefined;
  for (const property of Object.values(page.properties)) {
    const text = titleSchema.safeParse(property);
    if (text.success) title = text.data.title.map(({ plain_text }) => plain_text).join('').trim() || entry.name;
    const status = statusSchema.safeParse(property);
    if (status.success) detail = status.data.status.name;
  }
  const activity = entry.notionActivityDateProperty
    ? dateSchema.safeParse(page.properties[entry.notionActivityDateProperty])
    : undefined;
  return {
    title, link: page.url,
    timestamp: activity?.success ? new Date(activity.data.date.start).toISOString() : page.last_edited_time,
    ...(detail ? { detail } : {}),
  };
}

export async function loadNotion(entry: RegistryEntry, fetcher: typeof fetch, token?: string): Promise<Snapshot> {
  const fetchedAt = new Date().toISOString();
  const failed = (error: string): Snapshot => ({ entryId: entry.id, fetchedAt, status: 'error', items: [], error });
  const dataSource = entry.connector === 'notion-data-source';
  const id = notionId(entry.locator, dataSource);
  if (!id) return failed(dataSource ? 'Notion locator must identify a data source' : 'Notion locator must identify a page');
  if (!token?.trim()) return failed('NOTION_TOKEN is not configured');
  const headers = { authorization: `Bearer ${token.trim()}`, 'notion-version': '2026-03-11', 'content-type': 'application/json' };
  const signal = AbortSignal.timeout(30_000);
  const request = async (path: string, body?: object): Promise<unknown> => {
    const response = await fetcher(`https://api.notion.com/v1/${path}`, {
      headers, signal, redirect: 'error',
      ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined);
      throw new Error('Notion request failed');
    }
    return response.json();
  };
  try {
    const items: SnapshotItem[] = [];
    if (!dataSource) {
      items.push(pageItem(pageSchema.parse(await request(`pages/${id}`)), entry));
    } else {
      let cursor: string | undefined;
      const seen = new Set<string>();
      for (let page = 0; ; page += 1) {
        if (page >= 100) throw new Error('Notion pagination limit reached');
        const result = querySchema.parse(await request(`data_sources/${id}/query`, { page_size: 100, start_cursor: cursor, result_type: 'page' }));
        items.push(...result.results.map((row) => pageItem(row, entry)));
        if (!result.has_more) break;
        if (!result.next_cursor || seen.has(result.next_cursor)) throw new Error('Invalid Notion cursor');
        cursor = result.next_cursor;
        seen.add(cursor);
      }
    }
    return { entryId: entry.id, fetchedAt, status: 'ok', items };
  } catch {
    return failed(dataSource ? 'Notion data source could not be read' : 'Notion page could not be read');
  }
}
