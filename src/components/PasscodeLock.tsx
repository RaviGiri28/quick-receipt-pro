import { useState } from 'react';
import { Lock, LockKeyhole, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/Logo';
import { IconInput } from '@/components/IconInput';
import { PasscodeInput, PASSCODE_LENGTH } from '@/components/PasscodeInput';
import { useAuth } from '@/contexts/AuthContext';
import { authApi, errorMessage } from '@/lib/api';
import { markUnlocked } from '@/lib/appLock';

// Full-screen lock shown when the app is opened (or logged into) by a user with an app passcode.
export function PasscodeLock({ onUnlock }: { onUnlock: () => void }) {
  const { user, logout, removePasscode } = useAuth();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  // Forgot passcode: remove it with the account password instead.
  const [forgot, setForgot] = useState(false);
  const [password, setPassword] = useState('');

  const verify = async (code: string) => {
    if (!user || code.length !== PASSCODE_LENGTH) return;
    setChecking(true);
    setError('');
    try {
      await authApi.verifyPasscode(code);
      markUnlocked(user.id);
      onUnlock();
    } catch (err) {
      setError(errorMessage(err));
      setPasscode('');
    } finally {
      setChecking(false);
    }
  };

  const removeWithPassword = async () => {
    if (!password) return;
    setChecking(true);
    setError('');
    try {
      // With no passcode left, the app opens on its own.
      await removePasscode(password);
    } catch (err) {
      setError(errorMessage(err));
      setChecking(false);
    }
  };

  const switchMode = (toForgot: boolean) => {
    setForgot(toForgot);
    setPasscode('');
    setPassword('');
    setError('');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-canvas p-6 text-center">
      <Logo markClassName="h-12 w-12" textClassName="text-2xl" />
      {forgot ? (
        <form
          className="card-soft w-full max-w-sm space-y-5 p-6 sm:p-8"
          onSubmit={e => { e.preventDefault(); removeWithPassword(); }}
        >
          <div className="icon-tile mx-auto h-14 w-14 rounded-2xl"><Lock className="h-7 w-7" /></div>
          <div>
            <h1 className="text-xl font-bold text-navy">Forgot passcode?</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your account password to remove the passcode. You can set a new one in Settings.
            </p>
          </div>
          <IconInput
            icon={Lock}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            placeholder="Your account password"
            disabled={checking}
            autoFocus
          />
          {error && <p className="animate-fade-in-up text-sm text-destructive">{error}</p>}
          <Button type="submit" variant="destructive" className="w-full" disabled={checking || !password}>
            {checking ? 'Removing…' : 'Remove passcode'}
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => switchMode(false)} disabled={checking}>
            Back to passcode
          </Button>
        </form>
      ) : (
        <form
          className="card-soft w-full max-w-sm space-y-5 p-6 sm:p-8"
          onSubmit={e => { e.preventDefault(); verify(passcode); }}
        >
          <div className="icon-tile mx-auto h-14 w-14 rounded-2xl"><LockKeyhole className="h-7 w-7" /></div>
          <div>
            <h1 className="text-xl font-bold text-navy">Enter your passcode</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {user ? <>Welcome back, {user.name}. </> : null}Enter your 4-digit passcode to continue.
            </p>
          </div>
          <PasscodeInput
            value={passcode}
            onChange={v => { setPasscode(v); setError(''); }}
            onComplete={verify}
            invalid={!!error}
            disabled={checking}
            autoFocus
          />
          {error && <p className="animate-fade-in-up text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={checking || passcode.length !== PASSCODE_LENGTH}>
            {checking ? 'Checking…' : 'Unlock'}
          </Button>
          <button
            type="button"
            className="text-sm font-medium text-primary hover:underline"
            onClick={() => switchMode(true)}
          >
            Forgot passcode?
          </button>
          <Button type="button" variant="outline" className="w-full" onClick={logout}>
            <LogOut /> Log out
          </Button>
        </form>
      )}
    </div>
  );
}
