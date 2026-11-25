import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

it('stores an editable draft and idempotent archive separately across API restarts', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'productiveme-review-records-'));
  const registryPath = join(directory, 'registry.yaml');
  const statePath = join(directory, 'state.sqlite');
  await writeFile(registryPath, 'entries: []\n');
  const original = {
    period: 'weekly', rangeStart: '2026-11-23T00:00:00.000Z',
    rangeEnd: '2026-11-29T23:59:59.999Z', draft: 'Original summary',
  };
  let app = await buildApp({ registryPath, statePath });
  try {
    const archive = () => app.inject({ method: 'POST', url: '/review-entries', payload: { ...original, decisions: 'Read the backlog' } });
    expect((await archive()).statusCode).toBe(201);
    expect((await archive()).statusCode).toBe(200);
    const edited = { ...original, draft: 'Edited summary' };
    expect((await app.inject({ method: 'PUT', url: '/review-drafts/weekly', payload: edited })).statusCode).toBe(200);
    expect((await app.inject({ method: 'PUT', url: '/review-drafts/weekly?ifAbsent=1', payload: original })).json()).toEqual(edited);

    await app.close();
    app = await buildApp({ registryPath, statePath });
    const draft = await app.inject('/review-drafts/weekly');
    const entries = await app.inject('/review-entries?period=weekly');
    expect(draft.json()).toEqual({ draft: edited });
    expect(entries.json()).toEqual([expect.objectContaining({ ...original, decisions: 'Read the backlog' })]);
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});
