import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PasscodeInput, PASSCODE_LENGTH } from '@/components/PasscodeInput';
import { useAuth } from '@/contexts/AuthContext';
import { receiptsApi, errorMessage, ApiError } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/analytics';
import { formatInr } from '@/lib/utils';
import { ReceiptData } from '@/types/receipt';

// Row action that permanently deletes a receipt after a confirmation, which asks
// for the app passcode when the user has one (the server checks it).
export function DeleteReceiptButton({ receipt, source }: { receipt: ReceiptData; source: 'history' | 'saved' }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const needsPasscode = !!useAuth().user?.hasPasscode;
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  const openDialog = (o: boolean) => {
    if (deleting) return;
    setOpen(o);
    setPasscode('');
    setPasscodeError('');
  };

  const handleDelete = async () => {
    if (needsPasscode && passcode.length !== PASSCODE_LENGTH) return;
    setDeleting(true);
    setPasscodeError('');
    try {
      await receiptsApi.remove(receipt.id, needsPasscode ? passcode : undefined);
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Receipt deleted', description: `Receipt #${receipt.serialNumber} was deleted.` });
      trackEvent('receipt_deleted', { source });
      setOpen(false);
    } catch (err) {
      // Wrong passcode (or too many tries): show it in the dialog and let them try again.
      if (needsPasscode && err instanceof ApiError && (err.data?.code === 'PASSCODE_INVALID' || err.status === 429)) {
        setPasscodeError(errorMessage(err));
        setPasscode('');
        return;
      }
      toast({ title: 'Could not delete receipt', description: errorMessage(err), variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        className="h-9 w-9 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
        title="Delete"
        onClick={() => openDialog(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <AlertDialog open={open} onOpenChange={openDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete receipt #{receipt.serialNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              {receipt.accountHolder} · {formatInr(receipt.amount)} · {receipt.date}.
              It will be removed from both Saved Receipts and History. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {needsPasscode && (
            <form
              className="space-y-2 rounded-xl border bg-accent/40 p-4 text-center"
              onSubmit={e => { e.preventDefault(); handleDelete(); }}
            >
              <label htmlFor={`delete-passcode-${receipt.id}`} className="block text-sm font-semibold text-navy">
                Enter your passcode to delete
              </label>
              <PasscodeInput
                id={`delete-passcode-${receipt.id}`}
                value={passcode}
                onChange={v => { setPasscode(v); setPasscodeError(''); }}
                invalid={!!passcodeError}
                disabled={deleting}
                autoFocus
              />
              {passcodeError && <p className="text-sm text-destructive">{passcodeError}</p>}
            </form>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={e => { e.preventDefault(); handleDelete(); }}
              disabled={deleting || (needsPasscode && passcode.length !== PASSCODE_LENGTH)}
              className={buttonVariants({ variant: 'destructive' })}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
