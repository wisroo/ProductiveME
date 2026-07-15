import { describe, expect, it } from 'vitest';
import { CADENCES, DOMAIN_IDS, SUBDOMAINS, isDomainId } from '../src/types.js';

describe('domain constants', () => {
  it('defines exactly the four fixed domains, in brief order', () => {
    expect(DOMAIN_IDS).toEqual(['career', 'finance', 'personal-data', 'life']);
  });

  it('defines subdomains for every domain', () => {
    expect(Object.keys(SUBDOMAINS).sort()).toEqual([...DOMAIN_IDS].sort());
    expect(SUBDOMAINS.career).toEqual(['work', 'study', 'dream']);
    expect(SUBDOMAINS.life).toContain('rest');
  });

  it('defines the three cadences', () => {
    expect(CADENCES).toEqual(['weekly', 'monthly', 'quarterly']);
  });
});

describe('isDomainId', () => {
  it('accepts valid domain ids', () => {
    expect(isDomainId('personal-data')).toBe(true);
  });

  it('rejects unknown ids', () => {
    expect(isDomainId('productivity')).toBe(false);
  });
});
