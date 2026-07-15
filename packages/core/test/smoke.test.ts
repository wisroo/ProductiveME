import { describe, expect, it } from 'vitest';
import { DOMAIN_IDS } from '../src/index.js';

describe('workspace smoke', () => {
  it('resolves the core package', () => {
    expect(DOMAIN_IDS.length).toBe(4);
  });
});
