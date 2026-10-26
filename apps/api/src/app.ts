import { readFile } from 'node:fs/promises';
import Fastify from 'fastify';
import { parseRegistry } from '@productiveme/core';

export async function buildApp({ registryPath }: { registryPath: string }) {
  const entries = parseRegistry(await readFile(registryPath, 'utf8'));
  const app = Fastify();
  app.get('/registry', async () => entries);
  return app;
}
