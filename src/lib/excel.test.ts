import { describe, it, expect } from 'vitest';
import { buildReceiptRows } from './excel';
import { ReceiptData, defaultReceipt } from '@/types/receipt';

const receipt = (over: Partial<ReceiptData>): ReceiptData => ({
  ...defaultReceipt,
  id: '1',
  serialNumber: 1,
  accountHolder: 'RAVI KUMAR',
  accountNumber: '123456789012',
  ifscCode: 'SBIN0001234',
  amount: '2400.5',
  date: '5/10/2026',
  transactionId: 'TXN1',
  createdAt: '2026-10-05T10:00:00.000Z',
  ...over,
});

describe('buildReceiptRows', () => {
  it('includes bank, mobile, custom fields and notes in a stable column order', () => {
    const rows = buildReceiptRows(
      [receipt({ bankName: 'State Bank of India', customerMobile: '9876543210', notes: 'Paid in cash', customFields: { cf_1: 'Andheri West' } })],
      [{ id: 'cf_1', label: 'Branch Name' }, { id: 'cf_2', label: 'Agent Code' }],
    );
    expect(Object.keys(rows[0])).toEqual([
      'Serial No', 'Account Holder', 'Account Number', 'Bank Name', 'IFSC Code', 'Amount (₹)', 'Date',
      'Reference No', 'Customer Mobile', 'Status', 'Branch Name', 'Agent Code', 'Notes', 'Created At',
    ]);
    expect(rows[0]).toMatchObject({
      'Bank Name': 'State Bank of India',
      'Customer Mobile': '9876543210',
      'Branch Name': 'Andheri West',
      'Agent Code': '',
      'Notes': 'Paid in cash',
      'Amount (₹)': 2400.5,
    });
  });

  it('keeps values of custom fields no longer defined in settings', () => {
    const rows = buildReceiptRows([receipt({ customFields: { cf_old: 'Legacy value' } })], []);
    expect(rows[0].cf_old).toBe('Legacy value');
  });

  it('skips unlabeled custom field definitions', () => {
    const rows = buildReceiptRows([receipt({})], [{ id: 'cf_blank', label: '  ' }]);
    expect(Object.keys(rows[0])).not.toContain('  ');
    expect(Object.keys(rows[0])).not.toContain('cf_blank');
  });
});
