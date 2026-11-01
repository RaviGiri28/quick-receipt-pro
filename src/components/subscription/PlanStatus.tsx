import { useEffect, useState } from 'react';
import { Clock, Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { cn } from '@/lib/utils';

// Paid plans show "Renew" this many days before they end.
const RENEW_WINDOW_DAYS = 7;

function useNow(intervalMs: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

const pad = (n: number) => String(n).padStart(2, '0');

// "6d 04h 12m 09s"; compact: "6d 04h" (or "04h 12m" on the last day).
function formatCountdown(ms: number, compact = false) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (compact) return d > 0 ? `${d}d ${pad(h)}h` : `${pad(h)}h ${pad(m)}m`;
  return `${d > 0 ? `${d}d ` : ''}${pad(h)}h ${pad(m)}m ${pad(s)}s`;
}

// Top-right of the app header: time left on the trial or plan, and the Upgrade button.
// compact: the small strip shown under the header on phones.
export function PlanStatus({ compact = false }: { compact?: boolean }) {
  const { subscription, deactivated, openPaywall } = useSubscription();
  const now = useNow(1000);
  if (!subscription || subscription.status === 'admin' || deactivated) return null;

  const { status } = subscription;
  const left = subscription.expiresAt ? new Date(subscription.expiresAt).getTime() - now : 0;
  const running = (status === 'trial' || status === 'paid') && left > 0;
  const urgent = running && left < 24 * 3600 * 1000;
  const showButton = status !== 'paid' || left < RENEW_WINDOW_DAYS * 86400 * 1000;

  const chip = running ? (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold tabular-nums',
        urgent
          ? 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400'
          : status === 'paid'
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
            : 'border-primary/20 bg-primary/10 text-primary',
      )}
      title={`Ends on ${new Date(subscription.expiresAt!).toLocaleString('en-IN')}`}
    >
      {status === 'paid' ? <Crown className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
      <span className={cn(compact ? 'inline' : 'hidden lg:inline')}>{status === 'paid' ? 'Plan' : 'Free trial'}:</span>
      <span>{formatCountdown(left, compact)}</span>
      {!compact && <span className="hidden xl:inline">left</span>}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-amber-500/35 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
      <Clock className="h-3.5 w-3.5" />
      {status === 'none' ? 'No active plan' : status === 'paid' || subscription.plan === 'paid' ? 'Plan ended' : 'Trial ended'}
    </span>
  );

  return (
    <div className={cn('flex items-center gap-2', compact && 'w-full justify-between')}>
      {chip}
      {showButton && (
        <Button
          size="sm"
          onClick={openPaywall}
          className="btn-glow h-9 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 font-bold text-white hover:from-amber-600 hover:to-orange-600"
        >
          {status === 'paid' ? <Crown /> : <Sparkles />}
          {status === 'paid' ? 'Renew' : 'Upgrade now'}
        </Button>
      )}
    </div>
  );
}
