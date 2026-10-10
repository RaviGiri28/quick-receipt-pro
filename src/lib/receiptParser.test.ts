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

// Real pastes reported by users, plus common formats from banks, apps and DMT software.
describe('parseTransactionText real-world pastes', () => {
  it.each<[string, string, Record<string, string>]>([
    ['tab row: acct, name, ifsc, mobile, txn, amount',
      '694002120013492\tREENA\tUBIN0543560\t9580739218\tPPINY852622760W1221\t1000.00',
      { accountNumber: '694002120013492', accountHolder: 'REENA', ifscCode: 'UBIN0543560', customerMobile: '9580739218', amount: '1000.00', transactionId: 'PPINY852622760W1221' }],
    ['same row with 4-space gaps',
      '694002120013492    REENA    UBIN0543560    9580739218    PPINY852622760W1221    1000.00',
      { accountNumber: '694002120013492', accountHolder: 'REENA', ifscCode: 'UBIN0543560', customerMobile: '9580739218', amount: '1000.00' }],
    ['same row with single spaces',
      '694002120013492 REENA UBIN0543560 9580739218 PPINY852622760W1221 1000.00',
      { accountNumber: '694002120013492', accountHolder: 'REENA', ifscCode: 'UBIN0543560', customerMobile: '9580739218', amount: '1000.00' }],
    ['Swift Money: mobile, name, acct /ifsc',
      '8146257291    ANURAG SINGH    58020100006485 /BARB0BUPGBX',
      { customerMobile: '8146257291', accountHolder: 'ANURAG SINGH', accountNumber: '58020100006485', ifscCode: 'BARB0BUPGBX' }],
    ['Swift Money with tabs',
      '8146257291\tANURAG SINGH\t58020100006485 /BARB0BUPGBX',
      { customerMobile: '8146257291', accountHolder: 'ANURAG SINGH', accountNumber: '58020100006485', ifscCode: 'BARB0BUPGBX' }],
    ['+91 mobile',
      '694002120013492    REENA    UBIN0543560    +91 9580739218    1000.00',
      { customerMobile: '9580739218', accountNumber: '694002120013492' }],
    ['mobile-like account next to IFSC, mobile elsewhere',
      '9876501234\tSUNITA DEVI\tKKBK0001234\t8800112233\t500.00',
      { accountNumber: '9876501234', customerMobile: '8800112233', ifscCode: 'KKBK0001234', accountHolder: 'SUNITA DEVI' }],
    ['labelled block with odd labels',
      'Bene Name : Mohd. Imran\nA/c No. : 0123 4567 8901\nIFSC : icic0001234\nMob No : +91-98765-43210\nTxn Amount : Rs. 1,25,000/-',
      { accountHolder: 'Mohd. Imran', accountNumber: '012345678901', ifscCode: 'ICIC0001234', customerMobile: '9876543210', amount: '125000' }],
    ['header row + value row',
      'Name\tAccount No\tIFSC\tMobile\tAmount\nRAVI KUMAR\t12345678901\tSBIN0001234\t9876543210\t2500',
      { accountHolder: 'RAVI KUMAR', accountNumber: '12345678901', ifscCode: 'SBIN0001234', customerMobile: '9876543210', amount: '2500' }],
    ['one line with inline labels',
      'Name: RAVI KUMAR A/C: 50100012345678 IFSC: HDFC0001234 Amt: 1500 Mobile: 9876543210',
      { accountHolder: 'RAVI KUMAR', accountNumber: '50100012345678', ifscCode: 'HDFC0001234', amount: '1500', customerMobile: '9876543210' }],
    ['bank SMS sentence',
      'IMPS of Rs. 2,000.00 to A/c 31234567890 (SBIN0004321) RAVI KUMAR is successful. UTR 628312345678. Sender Mob 9123456780',
      { accountNumber: '31234567890', ifscCode: 'SBIN0004321', accountHolder: 'RAVI KUMAR', amount: '2000.00', customerMobile: '9123456780' }],
    ['charges and balance are not the amount',
      'Charges: 10.00\nAmount: 5000\nAvl Bal: 12000.50\nName: GEETA\nAccount: 12345678901234\nIFSC: PUNB0123400',
      { amount: '5000', accountHolder: 'GEETA', accountNumber: '12345678901234' }],
    ['IFSC typed with letter O',
      'RAVI  12345678901  SBINO001234  9876543210  700.00',
      { ifscCode: 'SBIN0001234', accountNumber: '12345678901', customerMobile: '9876543210' }],
    ['bank name between name and account, single spaces',
      'RAVI KUMAR STATE BANK OF INDIA 31234567890 SBIN0001234 Rs.500',
      { accountHolder: 'RAVI KUMAR', bankName: 'STATE BANK OF INDIA', accountNumber: '31234567890', amount: '500' }],
  ])('%s', (_, text, expected) => {
    expect(parseTransactionText(text)).toMatchObject(expected);
  });
});
