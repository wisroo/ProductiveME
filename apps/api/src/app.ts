import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import { computeSignals, DOMAIN_IDS, parseRegistry } from '@productiveme/core';
import { loadLatestSnapshots, summarizeDomains } from './snapshots.js';

const registryEntrySchema = {
  type: 'object',
  required: ['id', 'name', 'kind', 'domain', 'locator', 'connector'],
  properties: {
    id: { type: 'string' }, name: { type: 'string' },
    kind: { type: 'string', enum: ['repo', 'notion-page', 'folder', 'tool', 'project'] },
    domain: { type: 'string', enum: DOMAIN_IDS }, subdomain: { type: 'string' },
    locator: { type: 'string' }, connector: { type: 'string' },
    cadence: { type: 'string', enum: ['weekly', 'monthly', 'quarterly'] },
  },
} as const;

const snapshotSchema = {
  type: 'object',
  required: ['entryId', 'fetchedAt', 'status', 'items'],
  properties: {
    entryId: { type: 'string' }, fetchedAt: { type: 'string' },
    status: { type: 'string', enum: ['ok', 'error'] },
    items: {
      type: 'array', items: {
        type: 'object', required: ['title'],
        properties: {
          title: { type: 'string' }, detail: { type: 'string' },
          timestamp: { type: 'string' }, link: { type: 'string' },
        },
      },
    },
    error: { type: 'string' },
  },
} as const;

const signalSchema = {
  type: 'object',
  required: ['severity', 'domain', 'message'],
  properties: {
    severity: { type: 'string', enum: ['info', 'due', 'warning', 'blocked'] },
    domain: { type: 'string', enum: DOMAIN_IDS }, entryId: { type: 'string' },
    message: { type: 'string' }, suggestedAction: { type: 'string' },
  },
} as const;

const domainRollupSchema = {
  type: 'object',
  required: ['domain', 'health', 'entryCount', 'okCount', 'errorCount', 'itemCount', 'latestActivityAt'],
  properties: {
    domain: { type: 'string', enum: DOMAIN_IDS },
    health: { type: 'string', enum: ['healthy', 'degraded', 'unavailable'] },
    entryCount: { type: 'integer', minimum: 0 }, okCount: { type: 'integer', minimum: 0 },
    errorCount: { type: 'integer', minimum: 0 }, itemCount: { type: 'integer', minimum: 0 },
    latestActivityAt: { type: ['string', 'null'] },
  },
} as const;

export interface BuildAppOptions {
  registryPath: string;
  snapshotDir?: string;
  now?: () => string;
}

export async function buildApp({ registryPath, snapshotDir = join(dirname(registryPath), 'snapshots'), now = () => new Date().toISOString() }: BuildAppOptions) {
  const entries = parseRegistry(await readFile(registryPath, 'utf8'));
  const app = Fastify();
  await app.register(swagger, {
    openapi: { info: { title: 'ProductiveME API', version: '0.1.0' }, openapi: '3.0.3' },
  });

  app.get('/registry', { schema: { response: { 200: { type: 'array', items: registryEntrySchema } } } }, async () => entries);
  app.get('/snapshots', {
    schema: {
      querystring: { type: 'object', properties: { domain: { type: 'string', enum: DOMAIN_IDS } }, additionalProperties: false },
      response: {
        200: { type: 'array', items: snapshotSchema },
        400: { type: 'object', properties: { statusCode: { type: 'integer' }, error: { type: 'string' }, message: { type: 'string' } } },
      },
    },
  }, async (request) => {
    const domain = (request.query as { domain?: (typeof DOMAIN_IDS)[number] }).domain;
    return loadLatestSnapshots(snapshotDir, entries, domain);
  });
  app.get('/signals', { schema: { response: { 200: { type: 'array', items: signalSchema } } } }, async () => {
    const snapshots = await loadLatestSnapshots(snapshotDir, entries);
    return computeSignals(entries, snapshots, now());
  });
  app.get('/domains', { schema: { response: { 200: { type: 'array', items: domainRollupSchema } } } }, async () => {
    const snapshots = await loadLatestSnapshots(snapshotDir, entries);
    return summarizeDomains(entries, snapshots);
  });
  app.get('/openapi.json', async () => app.swagger());
  return app;
}
