import { useState } from 'react';
import { KeyRound, Lock, LockKeyhole, ShieldCheck, ShieldOff, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { FormSection } from '@/components/FormSection';
import { IconInput } from '@/components/IconInput';
import { PasscodeInput, PASSCODE_LENGTH } from '@/components/PasscodeInput';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { errorMessage } from '@/lib/api';

type Step = 'current' | 'new' | 'confirm';

const stepText: Record<Step, { title: string; description: string }> = {
  current: { title: 'Enter current passcode', description: 'Enter the passcode you use now.' },
  new: { title: 'Set a passcode', description: 'Choose a 4-digit passcode.' },
  confirm: { title: 'Confirm passcode', description: 'Enter the same 4 digits again.' },
};

// Popup that walks through [current →] new → confirm, one passcode per step.
function SetPasscodeDialog({ open, changing, onClose }: { open: boolean; changing: boolean; onClose: () => void }) {
  const { setPasscode } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>(changing ? 'current' : 'new');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setStep(changing ? 'current' : 'new');
    setCurrent('');
    setNext('');
    setValue('');
    setError('');
    onClose();
  };
  const close = () => { if (!saving) reset(); };

  const submit = async (code: string) => {
    if (code.length !== PASSCODE_LENGTH) return;
    setError('');
    setValue('');
    if (step === 'current') {
      setCurrent(code);
      setStep('new');
      return;
    }
    if (step === 'new') {
      setNext(code);
      setStep('confirm');
      return;
    }
    if (code !== next) {
      setError('Passcodes do not match. Choose your passcode again.');
      setNext('');
      setStep('new');
      return;
    }
    setSaving(true);
    try {
      await setPasscode(next, changing ? current : undefined);
      toast({
        title: changing ? 'Passcode changed' : 'Passcode set',
        description: 'It will be asked when the app is opened, and before editing or deleting a receipt.',
      });
      setSaving(false);
      reset();
    } catch (err) {
      setSaving(false);
      // A wrong current passcode means starting over from the first step.
      setError(errorMessage(err));
      setCurrent('');
      setNext('');
      setStep(changing ? 'current' : 'new');
    }
  };

  const { title, description } = stepText[step];
  const steps: Step[] = changing ? ['current', 'new', 'confirm'] : ['new', 'confirm'];

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) close(); }}>
      <DialogContent className="max-w-sm">
        <form onSubmit={e => { e.preventDefault(); submit(value); }} className="space-y-5">
          <DialogHeader className="items-center text-center sm:text-center">
            <div className="icon-tile mb-2 h-12 w-12"><LockKeyhole className="h-6 w-6" /></div>
            <DialogTitle>{changing && step === 'new' ? 'Choose a new passcode' : title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center gap-1.5" aria-hidden>
            {steps.map(s => (
              <span key={s} className={`h-1.5 w-8 rounded-full ${steps.indexOf(s) <= steps.indexOf(step) ? 'bg-primary' : 'bg-primary/15'}`} />
            ))}
          </div>
          <div className="space-y-2 text-center">
            {/* key: a fresh, focused input for each step */}
            <PasscodeInput
              key={step}
              value={value}
              onChange={v => { setValue(v); setError(''); }}
              onComplete={submit}
              invalid={!!error}
              disabled={saving}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={close} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving || value.length !== PASSCODE_LENGTH}>
              {saving ? 'Saving…' : step === 'confirm' ? 'Save passcode' : 'Next'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Popup that removes the passcode with the account password (works if it was forgotten).
function RemovePasscodeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { removePasscode } = useAuth();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [removing, setRemoving] = useState(false);

  const reset = () => {
    setPassword('');
    onClose();
  };
  const close = () => { if (!removing) reset(); };

  const remove = async () => {
    if (!password) return;
    setRemoving(true);
    try {
      await removePasscode(password);
      toast({ title: 'Passcode removed', description: 'The app no longer asks for a passcode.' });
      setRemoving(false);
      reset();
    } catch (err) {
      setRemoving(false);
      toast({ title: 'Could not remove passcode', description: errorMessage(err), variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) close(); }}>
      <DialogContent className="max-w-sm">
        <form onSubmit={e => { e.preventDefault(); remove(); }} className="space-y-5">
          <DialogHeader>
            <DialogTitle>Remove passcode</DialogTitle>
            <DialogDescription>Enter your login password to remove the passcode. This also works if you forgot it.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="removePasscodePassword" className="font-semibold text-navy">Account password</Label>
            <IconInput
              id="removePasscodePassword"
              icon={Lock}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Your account password"
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={close} disabled={removing}>Cancel</Button>
            <Button type="submit" variant="destructive" disabled={removing || !password}>
              {removing ? 'Removing…' : 'Remove passcode'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Settings section for the account's app passcode. Saved immediately, apart from Save Settings.
export function PasscodeSettings() {
  const hasPasscode = !!useAuth().user?.hasPasscode;
  const [dialog, setDialog] = useState<'set' | 'remove' | null>(null);

  return (
    <FormSection
      icon={LockKeyhole}
      title="Passcode"
      description="Lock the app, and protect editing and deleting receipts"
    >
      <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-accent/40 p-4">
        <span className={`icon-tile h-10 w-10 ${hasPasscode ? 'text-emerald-600' : 'text-muted-foreground'}`}>
          {hasPasscode ? <ShieldCheck className="h-5 w-5" /> : <ShieldOff className="h-5 w-5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-navy">{hasPasscode ? 'Passcode is on' : 'No passcode set'}</span>
          <span className="block text-sm text-muted-foreground">
            {hasPasscode
              ? 'Asked when the app is opened, and before editing or deleting a receipt.'
              : 'Anyone using this account can open the app and delete receipts.'}
          </span>
        </span>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => setDialog('set')}>
            <KeyRound /> {hasPasscode ? 'Change passcode' : 'Set passcode'}
          </Button>
          {hasPasscode && (
            <Button type="button" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDialog('remove')}>
              <Trash2 /> Remove
            </Button>
          )}
        </div>
      </div>

      {/* key: restart the steps whenever the popup is reopened or the mode changes */}
      <SetPasscodeDialog key={`${hasPasscode}`} open={dialog === 'set'} changing={hasPasscode} onClose={() => setDialog(null)} />
      <RemovePasscodeDialog open={dialog === 'remove'} onClose={() => setDialog(null)} />
    </FormSection>
  );
}
