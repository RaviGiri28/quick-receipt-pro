import { describe, it, expect } from 'vitest';
import { isValidIndianMobile, normalizeIndianMobile, validateReceipt } from './receiptValidation';

const valid = {
  accountHolder: 'Ravi Kumar',
  accountNumber: '1234567890',
  amount: '2400.50',
  date: '6/10/2026',
  transactionId: 'TXN1',
  bankName: 'SBI',
  customerMobile: '9876543210',
};

describe('validateReceipt', () => {
  it('accepts a complete receipt', () => {
    expect(validateReceipt(valid)).toBeNull();
  });

  it('names the first missing required field', () => {
    expect(validateReceipt({ ...valid, accountHolder: '  ' })).toBe('Account holder is required');
    expect(validateReceipt({ ...valid, bankName: '' })).toBe('Bank name is required');
    expect(validateReceipt({ ...valid, customerMobile: undefined })).toBe('Customer mobile is required');
  });

  it('rejects bad amounts', () => {
    expect(validateReceipt({ ...valid, amount: '0' })).toMatch(/greater than 0/);
    expect(validateReceipt({ ...valid, amount: 'abc' })).toMatch(/greater than 0/);
    expect(validateReceipt({ ...valid, amount: '10.555' })).toMatch(/2 decimal places/);
    expect(validateReceipt({ ...valid, amount: '100000000' })).toMatch(/too large/);
  });

  it('rejects invalid mobile numbers and dates', () => {
    expect(validateReceipt({ ...valid, customerMobile: '12345' })).toMatch(/Indian mobile/);
    expect(validateReceipt({ ...valid, date: '31/02/2026' })).toMatch(/valid date/);
  });
});

describe('mobile helpers', () => {
  it('normalizes common Indian formats', () => {
    expect(normalizeIndianMobile('+91 98765-43210')).toBe('9876543210');
    expect(normalizeIndianMobile('098765 43210')).toBe('9876543210');
    expect(isValidIndianMobile('+919876543210')).toBe(true);
    expect(isValidIndianMobile('5876543210')).toBe(false);
  });
});
