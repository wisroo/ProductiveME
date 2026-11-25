import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

it('shares slots between Plan and Life, protects existing plans, and restores deleted task assignments', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'productiveme-plan-'));
  const registryPath = join(dir, 'registry.yaml');
  await writeFile(registryPath, 'entries: []\n');
  const app = await buildApp({ registryPath });
  const week = '2026-11-23';
  const base = `/weeks/${week}`;
  try {
    const task = (await app.inject({ method: 'POST', url: '/tasks', payload: { week, domain: 'life', text: 'Run' } })).json() as { id: string };
    const slot = `${base}/life/sat/4/plan`;
    expect((await app.inject({ method: 'PUT', url: slot, payload: { value: { cat: 'exercise', title: 'Run', taskId: task.id } } })).statusCode).toBe(200);
    const conflict = await app.inject({ method: 'PUT', url: `${base}/plan`, payload: { protect: { sat: true } } });
    expect(conflict.statusCode).toBe(409);
    expect((await app.inject({ method: 'PUT', url: `${base}/life/sun/4/plan`, payload: { value: { cat: 'exercise', title: 'Run again', taskId: task.id } } })).statusCode).toBe(409);
    expect((await app.inject({ method: 'DELETE', url: `/tasks/${task.id}` })).statusCode).toBe(204);
    expect((await app.inject(`${base}/life`)).json().sat[4].plan.taskId).toBeUndefined();
    expect((await app.inject({ method: 'POST', url: `/tasks/${task.id}/restore` })).statusCode).toBe(200);
    expect((await app.inject(`${base}/life`)).json().sat[4].plan.taskId).toBe(task.id);
    expect((await app.inject({ method: 'PUT', url: `${base}/plan`, payload: { protect: { sun: true } } })).statusCode).toBe(200);
    expect((await app.inject(`${base}/life`)).json().sun[5].plan).toMatchObject({ protect: 'sun', cat: 'church' });
    expect((await app.inject({ method: 'PUT', url: `${base}/life/sun/5/plan`, payload: { value: { cat: 'rest', title: 'Rest' } } })).statusCode).toBe(200);
    expect((await app.inject(`${base}/plan`)).json().protect).toEqual({});
  } finally {
    await app.close();
    await rm(dir, { recursive: true, force: true });
  }
});
