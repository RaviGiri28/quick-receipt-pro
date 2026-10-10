import { describe, it, expect } from 'vitest';
import { displayDateToIso, isoToDisplayDate, localIsoDate, receiptFromApi, receiptToApi, userFromApi } from './api';

describe('date conversion', () => {
  it('converts en-IN display dates to ISO', () => {
    expect(displayDateToIso('5/10/2026')).toBe('2026-10-05');
    expect(displayDateToIso('05-10-2026')).toBe('2026-10-05');
    expect(displayDateToIso('2026-10-05')).toBe('2026-10-05');
  });

  it('rejects impossible or malformed dates', () => {
    expect(displayDateToIso('31/02/2026')).toBeNull();
    expect(displayDateToIso('10/2026')).toBeNull();
    expect(displayDateToIso('')).toBeNull();
  });

  it('formats local dates as YYYY-MM-DD without shifting to UTC', () => {
    // 00:30 local time is still the previous day in UTC for IST and other positive offsets.
    expect(localIsoDate(new Date(2026, 9, 5, 0, 30))).toBe('2026-10-05');
    expect(localIsoDate(new Date(2026, 0, 9, 23, 59))).toBe('2026-01-09');
  });

  it('formats ISO dates for display', () => {
    expect(isoToDisplayDate('2026-10-05')).toBe('5/10/2026');
    expect(isoToDisplayDate('2026-10-05T00:00:00.000Z')).toBe('5/10/2026');
  });
});

describe('receipt mapping', () => {
  const apiReceipt = {
    id: 7,
    account_holder: 'Ravi Kumar',
    account_number: '1234567890',
    ifsc_code: null,
    amount: '2400.50',
    date: '2026-10-05',
    transaction_id: 'TXN1',
    reference_number: null,
    status: 'Pending' as const,
    bank_name: 'SBI',
    customer_mobile: '9876543210',
    notes: null,
    custom_fields: { cf_1: 'Branch A' },
    is_dual_print: true,
    serial_number: 3,
    save_type: 'printed' as const,
    is_printed: true,
    created_at: '2026-10-05T10:00:00.000Z',
  };

  it('maps API receipts to the UI shape', () => {
    const r = receiptFromApi(apiReceipt);
    expect(r).toMatchObject({
      id: '7',
      amount: '2400.5',
      date: '5/10/2026',
      status: 'pending',
      ifscCode: '',
      referenceNumber: '',
      serialNumber: 3,
      isPrinted: true,
      customFields: { cf_1: 'Branch A' },
    });
  });

  it('round-trips back to the API shape', () => {
    const body = receiptToApi(receiptFromApi(apiReceipt));
    expect(body).toMatchObject({
      amount: 2400.5,
      date: '2026-10-05',
      status: 'Pending',
      save_type: 'printed',
      is_dual_print: true,
      custom_fields: { cf_1: 'Branch A' },
    });
  });

  it('drops empty custom field values and rejects bad dates', () => {
    expect(receiptToApi({ date: '5/10/2026', customFields: { a: ' ' } }).custom_fields).toBeNull();
    expect(() => receiptToApi({ date: 'yesterday' })).toThrow(/valid date/);
  });
});

describe('user mapping', () => {
  const apiUser = { id: 1, name: 'Ravi', email: 'r@example.com', business_name: 'Shop' };

  it('keeps account custom field definitions', () => {
    const defs = [{ id: 'cf_1', label: 'Branch' }];
    expect(userFromApi({ ...apiUser, custom_field_defs: defs }).customFields).toEqual(defs);
  });

  it('marks never-saved custom fields as null', () => {
    expect(userFromApi(apiUser).customFields).toBeNull();
    expect(userFromApi({ ...apiUser, custom_field_defs: null }).customFields).toBeNull();
  });
});
