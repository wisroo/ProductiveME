import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

it('saves finance totals and completes only the linked snapshot task', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'productiveme-finance-'));
  const registryPath = join(dir, 'registry.yaml');
  await writeFile(registryPath, 'entries: []\n');
  const app = await buildApp({ registryPath });
  const week = '2026-11-23';
  try {
    expect((await app.inject('/settings')).json()).toEqual({ reviewDefault: 'weekly' });
    const preference = await app.inject({ method: 'PUT', url: '/settings', payload: { reviewDefault: 'monthly' } });
    expect(preference.statusCode).toBe(200);
    expect((await app.inject('/settings')).json()).toEqual({ reviewDefault: 'monthly' });
    const task = (await app.inject({ method: 'POST', url: '/tasks', payload: { week, domain: 'finance', text: 'Month-end', kind: 'snapshot' } })).json() as { id: string };
    const input = { week, date: '2026-11-25', cash: 2_000_000, savings: 1_000_000, investments: 0, other: 0 };
    const saved = await app.inject({ method: 'POST', url: '/finance/snapshots', payload: { ...input, taskId: task.id } });
    expect(saved.statusCode).toBe(201);
    expect(saved.json()).toMatchObject({ date: input.date, total: 3_000_000 });
    expect((await app.inject(`/tasks?week=${week}`)).json()).toEqual([expect.objectContaining({ id: task.id, done: true })]);
    expect((await app.inject({ method: 'POST', url: '/finance/snapshots', payload: { ...input, cash: 4_000_000 } })).statusCode).toBe(200);
    expect((await app.inject('/finance/snapshots')).json()).toEqual([expect.objectContaining({ date: input.date, total: 5_000_000 })]);
  } finally {
    await app.close();
    await rm(dir, { recursive: true, force: true });
  }
});
