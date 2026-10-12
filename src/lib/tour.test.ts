import { describe, expect, it } from 'vitest';
import { parseTransactionText } from './receiptParser';
import { validateReceipt } from './receiptValidation';
import { DEMO_TRANSACTION } from './tour';

describe('tour demo transaction', () => {
  it('fills in every required receipt field', () => {
    const parsed = parseTransactionText(DEMO_TRANSACTION);
    expect(parsed).toMatchObject({
      accountHolder: 'Rahul Sharma',
      accountNumber: '50100234567891',
      ifscCode: 'HDFC0001234',
      amount: '2500.00',
      customerMobile: '9876543210',
    });
    expect(parsed.bankName).toBeTruthy();
    expect(validateReceipt({ ...parsed, date: '12/10/2026' })).toBeNull();
  });
});
