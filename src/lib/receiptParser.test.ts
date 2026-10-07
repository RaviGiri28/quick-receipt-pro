import { describe, it, expect } from 'vitest';
import { parseTransactionText } from './receiptParser';

describe('parseTransactionText amount labels', () => {
  it.each([
    ['Amount: 2,400.00', '2400.00'],
    ['Amount (Rs.): 1500', '1500'],
    ['Txn Amount - ₹ 750.50', '750.50'],
    ['Transaction Amount: INR 12,000', '12000'],
    ['Amt Paid: 99', '99'],
  ])('reads "%s"', (line, amount) => {
    expect(parseTransactionText(line).amount).toBe(amount);
  });

  it('reads the amount from the line after a bare label', () => {
    expect(parseTransactionText('Amount\n2,400.00').amount).toBe('2400.00');
  });

  it('keeps transaction IDs and amounts apart', () => {
    const r = parseTransactionText('Transaction ID: TXN3097631247\nTransaction Amount: 2,400.00');
    expect(r).toMatchObject({ transactionId: 'TXN3097631247', amount: '2400.00' });
  });

  it('parses a full labelled paste', () => {
    const r = parseTransactionText(
      'Account Holder Name: RAVI KUMAR\nAccount Number: 123456789012\nIFSC: SBIN0001234\nAmount: 2,400.00\n' +
      'Transaction ID: TXN3097631247\nUTR No: 412345678901\nBank Name: State Bank of India\nMobile: 9876543210',
    );
    expect(r).toEqual({
      accountHolder: 'RAVI KUMAR', accountNumber: '123456789012', ifscCode: 'SBIN0001234', amount: '2400.00',
      transactionId: 'TXN3097631247', referenceNumber: '412345678901', bankName: 'State Bank of India',
      customerMobile: '9876543210',
    });
  });
});
