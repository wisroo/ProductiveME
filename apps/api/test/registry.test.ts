import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true })));
});

async function registryFile(contents: string) {
  const directory = await mkdtemp(join(tmpdir(), 'productiveme-api-'));
  directories.push(directory);
  const path = join(directory, 'registry.yaml');
  await writeFile(path, contents);
  return path;
}

describe('registry API', () => {
  it('returns validated entries loaded from a YAML file', async () => {
    const registryPath = await registryFile(`entries:
  - id: portfolio
    name: Portfolio
    kind: repo
    domain: career
    locator: https://example.com/portfolio
    connector: static-file
`);
    const app = await buildApp({ registryPath });
    try {
      const response = await app.inject({ method: 'GET', url: '/registry' });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([{
        id: 'portfolio', name: 'Portfolio', kind: 'repo', domain: 'career',
        locator: 'https://example.com/portfolio', connector: 'static-file',
      }]);
    } finally {
      await app.close();
    }
  });

  it('rejects invalid registry configuration before serving requests', async () => {
    const registryPath = await registryFile('entries:\n  - id: broken\n');
    await expect(buildApp({ registryPath })).rejects.toThrow(/entries\.0\.domain/);
  });

  it('rejects a missing registry file before serving requests', async () => {
    const registryPath = await registryFile('entries: []');
    await expect(buildApp({ registryPath: `${registryPath}.missing` })).rejects.toThrow(/ENOENT/);
  });
});
