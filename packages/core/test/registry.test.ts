import { describe, expect, it } from 'vitest';
import { RegistryValidationError, parseRegistry } from '../src/registry.js';

const VALID = `
entries:
  - id: career-work-notes
    name: Work notes
    kind: notion-page
    domain: career
    subdomain: work
    locator: https://www.notion.so/example
    connector: static-file
  - id: finance-snapshot
    name: Monthly asset snapshot
    kind: tool
    domain: finance
    locator: file:///finance/snapshot
    connector: static-file
    cadence: monthly
`;

describe('parseRegistry', () => {
  it('parses a valid registry', () => {
    const entries = parseRegistry(VALID);
    expect(entries).toHaveLength(2);
    expect(entries[0]?.domain).toBe('career');
    expect(entries[1]?.cadence).toBe('monthly');
  });

  it('rejects an unknown domain with the offending path in the message', () => {
    const bad = VALID.replace('domain: career', 'domain: productivity');
    expect(() => parseRegistry(bad)).toThrow(RegistryValidationError);
    expect(() => parseRegistry(bad)).toThrow(/entries\.0\.domain/);
  });

  it('rejects a missing required field', () => {
    const bad = VALID.replace('    locator: https://www.notion.so/example\n', '');
    expect(() => parseRegistry(bad)).toThrow(/entries\.0\.locator/);
  });

  it('rejects an invalid cadence', () => {
    const bad = VALID.replace('cadence: monthly', 'cadence: daily');
    expect(() => parseRegistry(bad)).toThrow(/entries\.1\.cadence/);
  });

  it('rejects duplicate entry ids', () => {
    const bad = VALID.replaceAll('finance-snapshot', 'career-work-notes');
    expect(() => parseRegistry(bad)).toThrow(/duplicate entry id "career-work-notes"/);
  });

  it('rejects non-object yaml without a stray path prefix', () => {
    expect(() => parseRegistry('just a string')).toThrow(RegistryValidationError);
    // top-level issue has an empty path — the message must not begin "invalid registry: : "
    expect(() => parseRegistry('just a string')).not.toThrow(/registry: :/);
  });
});
