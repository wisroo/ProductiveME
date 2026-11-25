import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { SOURCE_DOMAIN_IDS, type SourceDomain, type RegistryEntry } from '@productiveme/core';
import { normalizedConnectorLocator } from '@productiveme/sync/connectors';
import type { FastifyInstance } from 'fastify';

const connectors = ['github', 'notion', 'notion-data-source', 'managed-folder', 'link'] as const;
type SourceInput = { name: string; domain: SourceDomain; locator: string; connector: typeof connectors[number] };
const name = { type: 'string', minLength: 1, maxLength: 120 } as const;
const domain = { type: 'string', enum: SOURCE_DOMAIN_IDS } as const;
const sourceBody = {
  type: 'object', required: ['name', 'domain', 'locator', 'connector'], additionalProperties: false,
  properties: { name, domain, locator: { type: 'string', minLength: 1, maxLength: 2048 }, connector: { type: 'string', enum: connectors } },
} as const;
const idParams = { type: 'object', required: ['id'], properties: { id: { type: 'string', maxLength: 128 } } } as const;
const error = { type: 'object', required: ['code', 'message'], properties: { code: { type: 'string' }, message: { type: 'string' } } } as const;

export function registerSourceRoutes(app: FastifyInstance, db: DatabaseSync, sources: () => RegistryEntry[],
  sourceSchema: object, testSource?: (entry: RegistryEntry) => Promise<boolean>) {
  const makeEntry = async (input: SourceInput): Promise<RegistryEntry | undefined> => {
    const locator = await normalizedConnectorLocator(input.connector, input.locator.trim());
    if (!locator || !input.name.trim()) return undefined;
    const kind = input.connector === 'github' ? 'repo' : input.connector === 'managed-folder' ? 'folder' : input.connector === 'link' ? 'tool' : 'notion-page';
    return { id: randomUUID(), name: input.name.trim(), domain: input.domain, connector: input.connector, locator, kind };
  };
  const save = (id: string, entry: RegistryEntry | null) => {
    db.prepare(`INSERT INTO registry_overrides (id, payload) VALUES (?, ?)
      ON CONFLICT(id) DO UPDATE SET payload = excluded.payload`).run(id, entry ? JSON.stringify(entry) : null);
  };
  app.post<{ Body: SourceInput }>('/sources', {
    schema: { body: sourceBody, response: { 201: sourceSchema, 400: error, 409: error } },
  }, async ({ body }, reply) => {
    const entry = await makeEntry(body);
    if (!entry) return reply.code(400).send({ code: 'INVALID_SOURCE', message: 'Enter a supported source and a valid locator.' });
    db.exec('BEGIN IMMEDIATE');
    try {
      if (sources().some((item) => item.domain === entry.domain && item.connector === entry.connector && item.locator === entry.locator)) {
        db.exec('ROLLBACK');
        return reply.code(409).send({ code: 'SOURCE_EXISTS', message: 'That source is already registered for this domain.' });
      }
      save(entry.id, entry);
      db.exec('COMMIT');
      return reply.code(201).send(entry);
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  });
  app.patch<{ Params: { id: string }; Body: Partial<Pick<SourceInput, 'name' | 'domain'>> }>('/sources/:id', {
    schema: {
      params: idParams, body: { type: 'object', minProperties: 1, properties: { name, domain }, additionalProperties: false },
      response: { 200: sourceSchema, 400: error, 404: error, 409: error },
    },
  }, ({ params, body }, reply) => {
    const entries = sources();
    const entry = entries.find(({ id }) => id === params.id);
    if (!entry) return reply.code(404).send({ code: 'SOURCE_NOT_FOUND', message: 'Source was not found.' });
    const updated = { ...entry, ...body, name: body.name?.trim() ?? entry.name };
    if (!updated.name) return reply.code(400).send({ code: 'INVALID_SOURCE', message: 'Enter a source name.' });
    if (entries.some((item) => item.id !== entry.id && item.domain === updated.domain && item.connector === updated.connector && item.locator === updated.locator)) {
      return reply.code(409).send({ code: 'SOURCE_EXISTS', message: 'That source is already registered for this domain.' });
    }
    save(updated.id, updated);
    return updated;
  });
  app.delete<{ Params: { id: string } }>('/sources/:id', {
    schema: { params: idParams, response: { 404: error } },
  }, ({ params }, reply) => {
    if (!sources().some(({ id }) => id === params.id)) return reply.code(404).send({ code: 'SOURCE_NOT_FOUND', message: 'Source was not found.' });
    save(params.id, null);
    return reply.code(204).send();
  });

  let testing = false;
  app.post<{ Body: SourceInput }>('/sources/test', {
    schema: {
      body: sourceBody,
      response: { 200: { type: 'object', required: ['reachable'], properties: { reachable: { type: 'boolean' } } }, 400: error, 409: error, 503: error },
    },
  }, async ({ body }, reply) => {
    const entry = await makeEntry(body);
    if (!entry) return reply.code(400).send({ code: 'INVALID_SOURCE', message: 'Enter a supported source and a valid locator.' });
    if (!testSource || entry.connector === 'link') return reply.code(503).send({ code: 'SOURCE_TEST_DISABLED', message: 'Connection testing is disabled.' });
    if (testing) return reply.code(409).send({ code: 'SOURCE_TEST_BUSY', message: 'Another connection test is running.' });
    testing = true;
    try {
      return { reachable: await testSource(entry) };
    } finally {
      testing = false;
    }
  });
}
