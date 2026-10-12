// Whether this browser tab has been unlocked with the app passcode.
// Kept in sessionStorage, so every newly opened tab or window asks for the passcode again.
const UNLOCKED_KEY = 'qr_unlocked_user';

export function isUnlocked(userId: number): boolean {
  try {
    return sessionStorage.getItem(UNLOCKED_KEY) === String(userId);
  } catch {
    return false;
  }
}

export function markUnlocked(userId: number): void {
  try {
    sessionStorage.setItem(UNLOCKED_KEY, String(userId));
  } catch {
    // Storage blocked: the lock screen will simply ask again on reload.
  }
}

export function clearUnlocked(): void {
  try {
    sessionStorage.removeItem(UNLOCKED_KEY);
  } catch {
    // Nothing stored.
  }
}
