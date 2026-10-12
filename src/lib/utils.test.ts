import { describe, it, expect } from 'vitest';
import { displayAccountNumber, maskAccountNumber } from './utils';

describe('maskAccountNumber', () => {
  it('keeps only the last 5 characters', () => {
    expect(maskAccountNumber('123456789012')).toBe('XXXXXXX89012');
  });

  it('leaves numbers of 5 characters or fewer unchanged', () => {
    expect(maskAccountNumber('12345')).toBe('12345');
    expect(maskAccountNumber('')).toBe('');
  });
});

describe('displayAccountNumber', () => {
  it('masks only receipts saved as masked', () => {
    expect(displayAccountNumber({ accountNumber: '123456789012', maskAccountNumber: true })).toBe('XXXXXXX89012');
    expect(displayAccountNumber({ accountNumber: '123456789012', maskAccountNumber: false })).toBe('123456789012');
    expect(displayAccountNumber({ accountNumber: '123456789012' })).toBe('123456789012');
  });
});
