import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

it('preserves tasks across restarts and allows a confirmed cap override', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'productiveme-tasks-'));
  const registryPath = join(directory, 'registry.yaml');
  const statePath = join(directory, 'state.sqlite');
  await writeFile(registryPath, 'entries: []\n');
  let app = await buildApp({ registryPath, statePath });
  const task = { week: '2026-11-23', domain: 'finance', text: 'Record assets' };
  try {
    const invalid = await app.inject({ method: 'POST', url: '/tasks', payload: { ...task, date: '2026-11-30' } });
    expect(invalid.statusCode).toBe(400);
    for (const text of ['Check savings', 'Reconcile cash']) {
      const response = await app.inject({ method: 'POST', url: '/tasks', payload: { ...task, text } });
      expect(response.statusCode).toBe(201);
    }
    const cap = await app.inject({ method: 'POST', url: '/tasks', payload: task });
    expect(cap.statusCode).toBe(409);
    expect(cap.json().code).toBe('CAP_EXCEEDED');
    const created = await app.inject({ method: 'POST', url: '/tasks?force=1', payload: task });
    expect(created.statusCode).toBe(201);
    const { id } = created.json() as { id: string };
    await app.close();
    app = await buildApp({ registryPath, statePath });
    const list = await app.inject({ method: 'GET', url: '/tasks?week=2026-11-23&domain=finance' });
    expect(list.json()).toHaveLength(3);
    const completed = await app.inject({ method: 'PATCH', url: `/tasks/${id}`, payload: { done: true } });
    expect(completed.json()).toMatchObject({ id, done: true });
    const deleted = await app.inject({ method: 'DELETE', url: `/tasks/${id}` });
    expect(deleted.statusCode).toBe(204);
    const restored = await app.inject({ method: 'POST', url: `/tasks/${id}/restore` });
    expect(restored.json()).toMatchObject({ id, done: true });
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});
