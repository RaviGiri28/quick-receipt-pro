import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, KeyRound, Mail, MailCheck, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { IconInput } from '@/components/IconInput';
import { AuthCard } from '@/components/AuthCard';
import { useToast } from '@/hooks/use-toast';
import { authApi, errorMessage } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  // The login page passes along the email that was typed there.
  const initialEmail = (useLocation().state as { email?: string } | null)?.email || '';
  const [email, setEmail] = useState(initialEmail);
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await authApi.forgotPassword(email.trim());
      trackEvent('password_reset_requested');
      setSentTo(email.trim());
    } catch (err) {
      toast({ title: 'Could not send the reset link', description: errorMessage(err), variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  if (sentTo) {
    return (
      <AuthCard icon={MailCheck} title="Check your email" description={<>If an account exists for <strong className="text-navy">{sentTo}</strong>, we have sent a link to reset your password.</>}>
        <ul className="space-y-2 rounded-2xl border bg-accent/40 p-4 text-sm text-muted-foreground">
          <li>• The link works once and expires in <strong className="text-navy">30 minutes</strong>.</li>
          <li>• Can't find it? Check your Spam or Promotions folder.</li>
          <li>• Still nothing after a few minutes? Check the email address and try again.</li>
        </ul>
        <div className="mt-6 flex flex-col gap-3">
          <Button asChild className="h-12 text-base"><Link to="/login"><ArrowLeft /> Back to login</Link></Button>
          <Button variant="ghost" onClick={() => setSentTo(null)}>Use a different email</Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard icon={KeyRound} title="Forgot password?" description="Enter the email you signed up with and we will send you a link to reset it.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="font-semibold text-navy">Email</Label>
          <IconInput id="email" icon={Mail} type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="h-12" maxLength={100} required autoFocus />
        </div>
        <Button type="submit" className="group h-12 w-full text-base" disabled={sending}>
          {sending ? 'Sending…' : <><Send className="transition-transform group-hover:translate-x-0.5" /> Send reset link</>}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Remembered it? <Link to="/login" className="font-semibold text-primary hover:underline">Back to login</Link>
        </p>
      </form>
    </AuthCard>
  );
}
