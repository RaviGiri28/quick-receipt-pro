import { useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PasscodeInput, PASSCODE_LENGTH } from '@/components/PasscodeInput';
import { authApi, errorMessage } from '@/lib/api';

// Asks for the app passcode (checked by the server) before a protected action.
export function PasscodeDialog({ open, title, description, onVerified, onCancel }: {
  open: boolean;
  title: string;
  description: string;
  onVerified: () => void;
  onCancel: () => void;
}) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const verify = async (code: string) => {
    if (code.length !== PASSCODE_LENGTH) return;
    setChecking(true);
    setError('');
    try {
      await authApi.verifyPasscode(code);
      setPasscode('');
      onVerified();
    } catch (err) {
      setError(errorMessage(err));
      setPasscode('');
    } finally {
      setChecking(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={o => { if (!o && !checking) onCancel(); }}>
      <AlertDialogContent>
        <form onSubmit={e => { e.preventDefault(); verify(passcode); }} className="space-y-5">
          <AlertDialogHeader>
            <div className="icon-tile mb-2 h-12 w-12"><LockKeyhole className="h-6 w-6" /></div>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 text-center">
            <PasscodeInput
              value={passcode}
              onChange={v => { setPasscode(v); setError(''); }}
              onComplete={verify}
              invalid={!!error}
              disabled={checking}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <AlertDialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={checking}>Cancel</Button>
            <Button type="submit" disabled={checking || passcode.length !== PASSCODE_LENGTH}>
              {checking ? 'Checking…' : 'Continue'}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
