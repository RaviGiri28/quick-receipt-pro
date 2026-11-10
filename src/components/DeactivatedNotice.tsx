import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, LifeBuoy, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadCount } from '@/hooks/use-notifications';
import { ACCOUNT_DEACTIVATED_EVENT } from '@/lib/api';

// The popup is shown once per tab session for each deactivation.
const seenKey = (userId: number) => `qr_deactivated_seen_${userId}`;

function wasSeen(userId: number, deactivatedAt: string) {
  try {
    return sessionStorage.getItem(seenKey(userId)) === deactivatedAt;
  } catch {
    return false;
  }
}

function markSeen(userId: number, deactivatedAt: string) {
  try {
    sessionStorage.setItem(seenKey(userId), deactivatedAt);
  } catch {
    // Storage blocked: the popup just shows again next time.
  }
}

// Popup and page banner for an account an admin has deactivated: it stays read-only
// (past receipts and data download still work, new or edited receipts are refused).
export function DeactivatedNotice() {
  const { user, refreshProfile } = useAuth();
  const { data: unread } = useUnreadCount();
  const [open, setOpen] = useState(false);
  const deactivatedAt = user?.deactivatedAt ?? null;

  // A new account notice raises the unread count: reload the profile to pick up the status.
  useEffect(() => {
    if (unread !== undefined) refreshProfile();
  }, [unread, refreshProfile]);

  // The server refused something because the account is deactivated: show the popup again.
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(ACCOUNT_DEACTIVATED_EVENT, show);
    return () => window.removeEventListener(ACCOUNT_DEACTIVATED_EVENT, show);
  }, []);

  useEffect(() => {
    if (user && deactivatedAt && !wasSeen(user.id, deactivatedAt)) setOpen(true);
    if (!deactivatedAt) setOpen(false);
  }, [user, deactivatedAt]);

  if (!user || !deactivatedAt) return null;

  const close = () => {
    markSeen(user.id, deactivatedAt);
    setOpen(false);
  };

  return (
    <>
      <div className="no-print mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-500/35 bg-amber-500/[0.08] p-4 animate-fade-in-up">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400">
          <ShieldAlert className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-navy">Your account has been deactivated</p>
          <p className="text-sm text-muted-foreground">
            You can still view your past receipts and download your data, but you can't create or edit receipts.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/support"><LifeBuoy /> Contact support</Link>
        </Button>
      </div>

      <Dialog open={open} onOpenChange={o => { if (!o) close(); }}>
        <DialogContent>
          <DialogHeader>
            <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400">
              <ShieldAlert className="h-6 w-6" />
            </span>
            <DialogTitle className="text-xl">Your account has been deactivated</DialogTitle>
            <DialogDescription>
              An administrator has deactivated your Quick Receipt Pro account.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 rounded-xl bg-accent/50 p-4 text-sm">
            <li>✅ You can still view and search your past receipts.</li>
            <li>✅ You can download all your data from Profile.</li>
            <li>⛔ You can't create, edit or print new receipts.</li>
          </ul>
          <p className="text-sm text-muted-foreground">If you think this is a mistake, please contact support.</p>
          <DialogFooter className="gap-2">
            <Button asChild variant="outline" onClick={close}>
              <Link to="/profile"><Download /> Download my data</Link>
            </Button>
            <Button asChild variant="outline" onClick={close}>
              <Link to="/support"><LifeBuoy /> Contact support</Link>
            </Button>
            <Button onClick={close}>OK, got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
