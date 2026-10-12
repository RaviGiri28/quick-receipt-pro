import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Link2Off, Lock, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { IconInput } from '@/components/IconInput';
import { AuthCard } from '@/components/AuthCard';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ApiError, authApi, errorMessage } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';

const MIN_PASSWORD_LENGTH = 6;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const token = useSearchParams()[0].get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [linkInvalid, setLinkInvalid] = useState(!token);

  const mismatch = confirm.length > 0 && confirm !== password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      toast({ title: 'Password too short', description: `Use at least ${MIN_PASSWORD_LENGTH} characters.`, variant: 'destructive' });
      return;
    }
    if (password !== confirm) {
      toast({ title: 'Passwords do not match', description: 'Type the same password in both boxes.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await authApi.resetPassword(token, password);
      trackEvent('password_reset_completed');
      // Every session was signed out by the reset, this browser's included.
      if (user) logout();
      toast({ title: 'Password reset', description: 'You can now log in with your new password.' });
      navigate('/login', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'RESET_LINK_INVALID') {
        setLinkInvalid(true);
      } else {
        toast({ title: 'Could not reset password', description: errorMessage(err), variant: 'destructive' });
      }
    } finally {
      setSaving(false);
    }
  };

  if (linkInvalid) {
    return (
      <AuthCard icon={Link2Off} title="Link expired" description="This reset link is invalid or has already been used. Links work once, for 30 minutes.">
        <div className="flex flex-col gap-3">
          <Button asChild className="h-12 text-base"><Link to="/forgot-password">Send a new link</Link></Button>
          <Button asChild variant="ghost"><Link to="/login">Back to login</Link></Button>
        </div>
      </AuthCard>
    );
  }

  const eyeButton = (
    <button type="button" className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-primary" onClick={() => setShow(!show)} aria-label={show ? 'Hide passwords' : 'Show passwords'}>
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <AuthCard icon={LockKeyhole} title="Choose a new password" description="You will be signed out on all devices, then you can log in with the new password.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="new-password" className="font-semibold text-navy">New password</Label>
          <IconInput
            id="new-password" icon={Lock} type={show ? 'text' : 'password'} autoComplete="new-password"
            value={password} onChange={e => setPassword(e.target.value)} placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            className="h-12" minLength={MIN_PASSWORD_LENGTH} maxLength={72} required autoFocus trailing={eyeButton}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password" className="font-semibold text-navy">Confirm new password</Label>
          <IconInput
            id="confirm-password" icon={Lock} type={show ? 'text' : 'password'} autoComplete="new-password"
            value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Type it again"
            className="h-12" maxLength={72} required aria-invalid={mismatch}
          />
          {mismatch && <p className="animate-fade-in-up text-xs text-destructive">Passwords do not match.</p>}
        </div>
        <Button type="submit" className="h-12 w-full text-base" disabled={saving || mismatch}>
          {saving ? 'Saving…' : 'Reset password'}
        </Button>
      </form>
    </AuthCard>
  );
}
