import { ReceiptData } from '@/types/receipt';
import { displayDateToIso } from '@/lib/api';

export const MOBILE_ERROR = 'Enter a valid Indian mobile number (10 digits, starting with 6-9; +91 optional)';

// "+91 98765-43210" / "098765 43210" -> "9876543210"; anything else is returned without spaces/dashes.
export function normalizeIndianMobile(value: string): string {
  const compact = value.replace(/\s|-/g, '');
  const match = compact.match(/^(?:\+?91|0)?([6-9]\d{9})$/);
  return match ? match[1] : compact;
}

export function isValidIndianMobile(value: string): boolean {
  return /^(?:\+?91|0)?[6-9]\d{9}$/.test(value.replace(/\s|-/g, ''));
}

// Same rules as the API, checked before saving so users get a clear message
// for the first problem instead of a failed request.
export function validateReceipt(r: Partial<ReceiptData>): string | null {
  const required: [keyof ReceiptData, string][] = [
    ['accountHolder', 'Account holder'],
    ['accountNumber', 'Account number'],
    ['amount', 'Amount'],
    ['bankName', 'Bank name'],
    ['customerMobile', 'Customer mobile'],
  ];
  for (const [key, label] of required) {
    if (!String(r[key] ?? '').trim()) return `${label} is required`;
  }

  const amount = Number(r.amount);
  if (!Number.isFinite(amount) || amount <= 0) return 'Amount must be a number greater than 0';
  if (amount > 99999999.99) return 'Amount is too large';
  if (!/^\d+(\.\d{1,2})?$/.test(String(r.amount).trim())) return 'Amount can have at most 2 decimal places';

  if (!isValidIndianMobile(r.customerMobile || '')) return MOBILE_ERROR;
  if (!displayDateToIso(r.date || '')) return 'Enter a valid date (DD/MM/YYYY)';
  return null;
}
