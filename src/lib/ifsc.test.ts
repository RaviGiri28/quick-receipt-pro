import { describe, expect, it } from 'vitest';
import { bankNameFromIfsc, isIfscFormat } from './ifsc';

describe('bankNameFromIfsc', () => {
  it('resolves the bank from the IFSC prefix', async () => {
    expect(await bankNameFromIfsc('SBIN0001234')).toBe('State Bank of India');
    expect(await bankNameFromIfsc(' hdfc0000123 ')).toBe('HDFC Bank');
  });

  it('resolves sublet branches to their actual bank', async () => {
    expect(await bankNameFromIfsc('APBL0001001')).not.toBe(await bankNameFromIfsc('APBL0099999'));
  });

  it('returns null for malformed or unknown codes', async () => {
    expect(await bankNameFromIfsc('SBIN1001234')).toBeNull();
    expect(await bankNameFromIfsc('ZZZZ0001234')).toBeNull();
    expect(await bankNameFromIfsc('')).toBeNull();
  });

  it('checks the IFSC format', () => {
    expect(isIfscFormat('ICIC0000001')).toBe(true);
    expect(isIfscFormat('ICIC000001')).toBe(false);
  });
});
