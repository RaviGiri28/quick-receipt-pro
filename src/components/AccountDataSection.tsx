import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Database, Download, Eye, EyeOff, Lock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { FormSection, Field } from '@/components/FormSection';
import { IconInput } from '@/components/IconInput';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { errorMessage, localIsoDate, receiptsApi } from '@/lib/api';
import { exportToExcel } from '@/lib/excel';
import { DELETION_GRACE_DAYS } from '@/lib/legal';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

// Profile → "Your data": download every receipt, or delete the account (restorable
// for DELETION_GRACE_DAYS, then erased by the server).
export function AccountDataSection() {
  const { user, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const receipts = await receiptsApi.listAll({});
      if (!receipts.length) {
        toast({ title: 'Nothing to download', description: 'You have no receipts yet.' });
        return;
      }
      exportToExcel(receipts, `quick-receipt-all-receipts-${localIsoDate()}`, user?.customFields || []);
      toast({ title: 'Download started', description: `${receipts.length} receipt${receipts.length === 1 ? '' : 's'} exported.` });
    } catch (err) {
      toast({ title: 'Download failed', description: errorMessage(err), variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const closeDelete = () => {
    setDeleteOpen(false);
    setPassword('');
    setUnderstood(false);
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleting(true);
    try {
      const deleteOn = await deleteAccount(password);
      toast({
        title: 'Account deleted',
        description: `You can restore it by logging in before ${formatDate(deleteOn)}. After that it is erased permanently.`,
      });
      navigate('/login');
    } catch (err) {
      toast({ title: 'Could not delete account', description: errorMessage(err), variant: 'destructive' });
      setDeleting(false);
    }
  };

  return (
    <>
      <FormSection icon={Database} title="Your Data" description="Download your receipts or delete your account">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-accent/40 p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy">Download all receipts</p>
              <p className="text-xs text-muted-foreground">Saved and printed receipts, as an Excel file.</p>
            </div>
            <Button variant="secondary" onClick={handleExport} disabled={exporting}>
              <Download /> {exporting ? 'Preparing…' : 'Download'}
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-destructive">Delete account</p>
              <p className="text-xs text-muted-foreground">
                Restorable for {DELETION_GRACE_DAYS} days, then your account and all receipts are erased.{' '}
                <Link to="/privacy#retention" className="text-primary hover:underline">Learn more</Link>
              </p>
            </div>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 /> Delete account
            </Button>
          </div>
        </div>
      </FormSection>

      <Dialog open={deleteOpen} onOpenChange={open => { if (!open && !deleting) closeDelete(); }}>
        <DialogContent>
          <form onSubmit={handleDelete} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-xl text-destructive">Delete your account?</DialogTitle>
              <DialogDescription>
                You will be logged out on all devices. For the next {DELETION_GRACE_DAYS} days you can restore everything by
                logging in again. After that, your account, business details and all receipts are permanently erased
                and cannot be recovered.
              </DialogDescription>
            </DialogHeader>
            <Button type="button" variant="outline" className="w-full" onClick={handleExport} disabled={exporting}>
              <Download /> {exporting ? 'Preparing…' : 'Download my receipts first'}
            </Button>
            <Field label="Enter your password to confirm" htmlFor="delete-password">
              <IconInput
                id="delete-password"
                icon={Lock}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                trailing={
                  <button type="button" className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-primary" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
            </Field>
            <label htmlFor="delete-understood" className="flex cursor-pointer items-start gap-3 text-sm">
              <Checkbox id="delete-understood" checked={understood} onCheckedChange={v => setUnderstood(!!v)} className="mt-0.5 h-5 w-5 rounded-md" />
              <span>I understand that after {DELETION_GRACE_DAYS} days my receipts cannot be recovered.</span>
            </label>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={closeDelete} disabled={deleting}>Cancel</Button>
              <Button type="submit" variant="destructive" disabled={!understood || !password || deleting}>
                <Trash2 /> {deleting ? 'Deleting…' : 'Delete my account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
