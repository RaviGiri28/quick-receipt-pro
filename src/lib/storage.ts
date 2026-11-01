import { AppSettings } from '@/types/receipt';

// Receipts and the user profile live on the backend (see lib/api.ts).
// Only per-device receipt display preferences are kept in localStorage.
const SETTINGS_KEY = 'qr_settings';

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
  };
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  applyPrintAlign(settings);
}

// The print stylesheet (index.css) reads this to place a single receipt on the page,
// so every page that prints follows the setting.
export function applyPrintAlign(settings: AppSettings = getSettings()): void {
  document.documentElement.dataset.printAlign = settings.printAlign || 'left';
}
