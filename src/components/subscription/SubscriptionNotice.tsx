import { Gift, Sparkles, Ticket, TimerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/contexts/SubscriptionContext';

// Page banner while the account can't create receipts (trial or plan ended, or never started).
export function SubscriptionNotice() {
  const { subscription, deactivated, offer, openPaywall, openOffer } = useSubscription();
  // A deactivated account sees the deactivation notice instead.
  if (!subscription || subscription.canCreate || deactivated) return null;

  const neverStarted = subscription.status === 'none';
  const title = neverStarted
    ? (offer ? `Start your free ${offer.trial_days}-day trial` : 'Choose a plan to create receipts')
    : subscription.plan === 'paid' ? 'Your plan has ended' : 'Your free trial has ended';

  return (
    <div className="no-print mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-500/35 bg-amber-500/[0.08] p-4 animate-fade-in-up">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400">
        {neverStarted && offer ? <Gift className="h-5 w-5" /> : <TimerOff className="h-5 w-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-navy">{title}</p>
        <p className="text-sm text-muted-foreground">
          You can still view and download your past receipts, but creating new receipts needs an active plan.
        </p>
      </div>
      {neverStarted && offer ? (
        <Button size="sm" onClick={openOffer}><Gift /> Get {offer.trial_days} days free</Button>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={openPaywall}><Ticket /> Have a coupon?</Button>
          <Button size="sm" onClick={openPaywall}><Sparkles /> Upgrade now</Button>
        </div>
      )}
    </div>
  );
}
