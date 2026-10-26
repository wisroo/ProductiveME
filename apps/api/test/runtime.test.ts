import { EventEmitter } from 'node:events';
import { Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { parseApiRuntimeConfig, registerGracefulShutdown } from '../src/runtime.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const registryPath = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'registry.yaml');

describe('API runtime', () => {
  it('defaults to loopback and validates configured host and port', () => {
    expect(parseApiRuntimeConfig({})).toEqual({ host: '127.0.0.1', port: 3000 });
    expect(parseApiRuntimeConfig({ API_HOST: '0.0.0.0', API_PORT: '4567' })).toEqual({ host: '0.0.0.0', port: 4567 });
    expect(() => parseApiRuntimeConfig({ API_HOST: ' ' })).toThrow('API_HOST must be a non-empty host name or IP address');
    expect(() => parseApiRuntimeConfig({ API_PORT: '0' })).toThrow('API_PORT must be an integer from 1 to 65535');
    expect(() => parseApiRuntimeConfig({ API_PORT: '3000x' })).toThrow('API_PORT must be an integer from 1 to 65535');
  });

  it('redacts request credentials and query values from JSON request logs', async () => {
    const records: string[] = [];
    const stream = new Writable({ write(chunk, _encoding, callback) { records.push(String(chunk)); callback(); } });
    const app = await buildApp({ registryPath, loggerStream: stream });
    try {
      await app.inject({
        method: 'GET', url: '/healthz?locator=/private/path',
        headers: { authorization: 'Bearer secret-token', cookie: 'session=private-cookie', 'x-api-key': 'private-api-key' },
      });
      const output = records.join('');
      expect(output).toContain('"level":30');
      expect(output).not.toContain('secret-token');
      expect(output).not.toContain('private-cookie');
      expect(output).not.toContain('private-api-key');
      expect(output).not.toContain('/private/path');
      expect(output).toContain('[REDACTED]');
    } finally {
      await app.close();
    }
  });

  it('does not expose unknown route URLs or query secrets in the response or any log record', async () => {
    const records: string[] = [];
    const stream = new Writable({ write(chunk, _encoding, callback) { records.push(String(chunk)); callback(); } });
    const app = await buildApp({ registryPath, loggerStream: stream });
    try {
      const response = await app.inject({ method: 'GET', url: '/private-locator?token=unknown-route-secret' });
      expect(response.statusCode).toBe(404);
      expect(response.body).not.toContain('/private-locator');
      expect(response.body).not.toContain('unknown-route-secret');
      expect(records.join('')).not.toContain('/private-locator');
      expect(records.join('')).not.toContain('unknown-route-secret');
    } finally {
      await app.close();
    }
  });

  it('closes the Fastify server when SIGTERM is received', async () => {
    const processEvents = new EventEmitter();
    let closed = false;
    registerGracefulShutdown({ close: async () => { closed = true; } }, processEvents);
    processEvents.emit('SIGTERM');
    await new Promise((resolve) => setImmediate(resolve));
    expect(closed).toBe(true);
  });
});
