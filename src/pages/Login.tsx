import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { IconInput } from '@/components/IconInput';
import { PrinterHero } from '@/components/PrinterHero';
import { Logo, LogoMark } from '@/components/brand/Logo';
import { AuthBackground, HandNote } from '@/components/AuthDecor';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ArrowRight, Eye, EyeOff, Lock, Mail, Moon, Printer, ShieldCheck, Sun, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/analytics';
import { ApiError, errorMessage } from '@/lib/api';
import { LegalLinks } from '@/components/SiteFooter';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SUPPORT_EMAIL } from '@/lib/config';

const highlights = [
  { icon: Zap, label: 'Fast & Easy' },
  { icon: ShieldCheck, label: 'Secure & Reliable' },
  { icon: Printer, label: 'Print Ready' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, login, restoreAccount } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Set when the account was deleted but can still be restored (until this date).
  const [restorableUntil, setRestorableUntil] = useState<string | null>(null);

  if (user) return <Navigate to="/" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password, remember);
      trackEvent('login', { method: 'email' });
      navigate('/');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'ACCOUNT_DELETION_PENDING') {
        setRestorableUntil(String(err.data?.delete_on || ''));
      } else {
        toast({ title: 'Login failed', description: errorMessage(err), variant: 'destructive' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestore = async () => {
    setSubmitting(true);
    try {
      await restoreAccount(email, password, remember);
      toast({ title: 'Account restored', description: 'Welcome back! Your account and receipts are safe.' });
      navigate('/');
    } catch (err) {
      toast({ title: 'Could not restore account', description: errorMessage(err), variant: 'destructive' });
    } finally {
      setSubmitting(false);
      setRestorableUntil(null);
    }
  };

  const restoreDeadline = restorableUntil && !Number.isNaN(Date.parse(restorableUntil))
    ? new Date(restorableUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas">
      <AuthBackground />
      <button
        onClick={toggleTheme}
        className="absolute right-4 top-4 z-20 rounded-full p-2.5 text-navy transition-colors hover:bg-accent"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-10 sm:px-8 lg:grid-cols-[1.1fr_1fr]">
        {/* Brand side */}
        <div className="hidden lg:block">
          <div className="stagger space-y-5">
            <Link to="/landing" className="inline-block"><Logo markClassName="h-14 w-14" textClassName="text-3xl" /></Link>
            <div className="pt-6">
              <p className="text-2xl font-semibold text-muted-foreground">Welcome to</p>
              <h1 className="text-5xl font-extrabold leading-[1.05] text-navy xl:text-6xl">
                Quick Receipt
                <span className="block text-gradient">Generator</span>
              </h1>
            </div>
            <p className="max-w-md text-lg text-muted-foreground">
              Create professional transaction receipts instantly. Save, manage and print receipts with ease.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              {highlights.map(h => (
                <span key={h.label} className="flex items-center gap-2 text-sm font-medium text-navy">
                  <span className="icon-tile h-9 w-9 rounded-full"><h.icon className="h-4 w-4" /></span>
                  {h.label}
                </span>
              ))}
            </div>
          </div>
          <div className="relative -mt-2 grid grid-cols-[auto_1fr] items-end">
            <div className="mb-10 animate-fade-in-up [animation-delay:0.6s]">
              <HandNote lines={['Simple Receipts.', 'Smarter Business.']} />
            </div>
            <div className="max-w-[470px] animate-fade-in-up [animation-delay:0.2s]">
              <PrinterHero />
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="mx-auto w-full max-w-[520px] animate-fade-in-up [animation-delay:0.1s]">
          <div className="lg:hidden mb-8 flex justify-center"><Logo markClassName="h-12 w-12" textClassName="text-2xl" /></div>
          <div className="card-soft rounded-3xl p-7 shadow-[0_30px_80px_-30px_hsl(var(--shadow-color)/0.35)] sm:p-10">
            <div className="text-center">
              <LogoMark className="mx-auto h-20 w-20 animate-float" />
              <h2 className="mt-5 text-3xl font-extrabold text-navy">Welcome Back</h2>
              <p className="mt-1.5 text-muted-foreground">Sign in to your Quick Receipt account</p>
            </div>
            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold text-navy">Email</Label>
                <IconInput id="email" icon={Mail} type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="h-12" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="font-semibold text-navy">Password</Label>
                <IconInput
                  id="password"
                  icon={Lock}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-12"
                  required
                  trailing={
                    <button type="button" className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-primary" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox checked={remember} onCheckedChange={v => setRemember(!!v)} id="remember" className="h-5 w-5 rounded-md" />
                  <Label htmlFor="remember" className="cursor-pointer text-sm font-medium">Remember me</Label>
                </div>
                <button
                  type="button"
                  className="text-sm font-semibold text-primary hover:underline"
                  onClick={() => toast({
                    title: 'Forgot your password?',
                    description: `Email ${SUPPORT_EMAIL} from your registered email address and we will help you reset it.`,
                  })}
                >
                  Forgot password?
                </button>
              </div>
              <Button type="submit" className="group h-12 w-full text-base" disabled={submitting}>
                {submitting ? (
                  <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Signing in…</>
                ) : (
                  <>Sign In <ArrowRight className="transition-transform group-hover:translate-x-1" /></>
                )}
              </Button>
              <p className="pt-2 text-center text-sm text-muted-foreground">
                Don't have an account? <Link to="/signup" className="font-semibold text-primary hover:underline">Sign up</Link>
              </p>
            </form>
          </div>
          <LegalLinks className="mt-5 text-muted-foreground" />
        </div>
      </div>

      <AlertDialog open={restorableUntil !== null} onOpenChange={open => { if (!open) setRestorableUntil(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This account was deleted and will be permanently erased{restoreDeadline ? ` on ${restoreDeadline}` : ' soon'}.
              Restore it to keep your account and all your receipts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Not now</AlertDialogCancel>
            <AlertDialogAction onClick={e => { e.preventDefault(); handleRestore(); }} disabled={submitting}>
              {submitting ? 'Restoring…' : 'Restore account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
