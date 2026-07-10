import { describe, expect, it } from 'vitest';
import { CORE_PACKAGE } from '../src/index.js';

describe('workspace smoke', () => {
  it('resolves the core package', () => {
    expect(CORE_PACKAGE).toBe('@productiveme/core');
  });
});
