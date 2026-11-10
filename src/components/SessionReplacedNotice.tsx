import { MonitorSmartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';

// Shown after this device was signed out because the account logged in on another device
// (an account can be used on one device at a time).
export function SessionReplacedNotice() {
  const { logoutNotice, dismissLogoutNotice } = useAuth();
  if (!logoutNotice) return null;

  const when = logoutNotice.signedInAt
    ? new Date(logoutNotice.signedInAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  return (
    <Dialog open onOpenChange={o => { if (!o) dismissLogoutNotice(); }}>
      <DialogContent>
        <DialogHeader>
          <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400">
            <MonitorSmartphone className="h-6 w-6" />
          </span>
          <DialogTitle className="text-xl">You've been logged out</DialogTitle>
          <DialogDescription>
            Your account was signed in on another device, so this device was logged out.
            An account can be used on only one device at a time.
          </DialogDescription>
        </DialogHeader>
        {(logoutNotice.device || when) && (
          <ul className="space-y-1 rounded-xl bg-accent/50 p-4 text-sm">
            {logoutNotice.device && <li><span className="text-muted-foreground">New sign-in:</span> {logoutNotice.device}</li>}
            {when && <li><span className="text-muted-foreground">When:</span> {when}</li>}
          </ul>
        )}
        <p className="text-sm text-muted-foreground">
          If this wasn't you, log in again and change your password right away.
        </p>
        <DialogFooter>
          <Button onClick={dismissLogoutNotice}>OK, got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
