import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DOMAIN_IDS, parseRegistry } from '../src/index.js';

// The test (not core src) may touch the filesystem: it validates the repo's
// real registry file so CI fails when a hand-edit breaks it.
const REGISTRY_PATH = fileURLToPath(new URL('../../../registry.yaml', import.meta.url));

describe('repo registry.yaml', () => {
  it('parses and covers all four domains', () => {
    const entries = parseRegistry(readFileSync(REGISTRY_PATH, 'utf8'));
    expect(entries.length).toBeGreaterThanOrEqual(4);
    const domains = new Set(entries.map((entry) => entry.domain));
    for (const domain of DOMAIN_IDS) expect(domains.has(domain)).toBe(true);
  });
});
