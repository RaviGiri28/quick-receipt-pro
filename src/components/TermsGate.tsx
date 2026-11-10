import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileCheck2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { errorMessage } from '@/lib/api';

// Users who haven't accepted the current Terms and Privacy Policy (accounts created
// before them, or after an update) must accept before using the app. The documents
// themselves stay readable.
export function TermsGate() {
  const { user, acceptTerms, logout } = useAuth();
  const { pathname } = useLocation();
  const { toast } = useToast();
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!user || user.termsAccepted || pathname === '/privacy' || pathname === '/terms') return null;

  const accept = async () => {
    setSaving(true);
    try {
      await acceptTerms();
    } catch (err) {
      toast({ title: 'Could not save', description: errorMessage(err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="icon-tile mb-2 h-12 w-12"><FileCheck2 className="h-6 w-6" /></div>
          <AlertDialogTitle>Please review our Terms and Privacy Policy</AlertDialogTitle>
          <AlertDialogDescription>
            To keep using Quick Receipt Pro, please read and accept our Terms &amp; Conditions and Privacy Policy. They
            explain how your account and receipt data are stored and protected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <label htmlFor="accept-terms-gate" className="flex cursor-pointer items-start gap-3 rounded-xl border bg-accent/40 p-4 text-sm">
          <Checkbox id="accept-terms-gate" checked={agreed} onCheckedChange={v => setAgreed(!!v)} className="mt-0.5 h-5 w-5 rounded-md" />
          <span>
            I have read and agree to the{' '}
            <Link to="/terms" target="_blank" className="font-semibold text-primary hover:underline">Terms &amp; Conditions</Link> and the{' '}
            <Link to="/privacy" target="_blank" className="font-semibold text-primary hover:underline">Privacy Policy</Link>.
          </span>
        </label>
        <AlertDialogFooter className="gap-2">
          <Button variant="outline" onClick={logout}><LogOut /> Log out</Button>
          <Button onClick={accept} disabled={!agreed || saving}>{saving ? 'Saving…' : 'Accept and continue'}</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
