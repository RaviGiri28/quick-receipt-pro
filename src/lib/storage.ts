import { ReceiptData, AppSettings } from '@/types/receipt';

const RECEIPTS_KEY = 'qr_receipts';
const SETTINGS_KEY = 'qr_settings';
const SERIALS_KEY = 'qr_serial_global';

export function getReceipts(): ReceiptData[] {
  try {
    return JSON.parse(localStorage.getItem(RECEIPTS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveReceipt(receipt: ReceiptData): void {
  const receipts = getReceipts();
  const existing = receipts.findIndex(r => r.id === receipt.id);
  if (existing >= 0) {
    receipts[existing] = receipt;
  } else {
    receipts.unshift(receipt);
  }
  localStorage.setItem(RECEIPTS_KEY, JSON.stringify(receipts));
}

export function getReceiptById(id: string): ReceiptData | null {
  return getReceipts().find(r => r.id === id) || null;
}

export function deleteReceipt(id: string): void {
  const receipts = getReceipts().filter(r => r.id !== id);
  localStorage.setItem(RECEIPTS_KEY, JSON.stringify(receipts));
}

export function getNextSerial(): number {
  const current = parseInt(localStorage.getItem(SERIALS_KEY) || '0', 10);
  const next = current + 1;
  localStorage.setItem(SERIALS_KEY, String(next));
  return next;
}

export function getSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    dualReceipt: false,
    showLogo: true,
    showName: true,
    showWatermark: true,
    primaryColor: '217 91% 30%',
    customFields: [],
  };
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getStats() {
  const receipts = getReceipts();
  const today = new Date().toDateString();
  const todayReceipts = receipts.filter(r => new Date(r.createdAt).toDateString() === today);
  const totalAmount = receipts.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const accounts = new Set(receipts.map(r => r.accountNumber).filter(Boolean)).size;
  const pendingCount = receipts.filter(r => r.status === 'pending').length;
  return { total: receipts.length, today: todayReceipts.length, totalAmount, accounts, pendingCount };
}
