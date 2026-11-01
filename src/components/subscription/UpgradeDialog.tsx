import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  BadgeCheck, Check, Crown, FileSpreadsheet, History, LifeBuoy, Printer, ShieldCheck, Sparkles, Ticket, X, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useToast } from '@/hooks/use-toast';
import { errorMessage, type Plan } from '@/lib/api';
import { cn, formatInr } from '@/lib/utils';

const features = [
  { icon: Zap, text: 'Unlimited receipts with Smart Paste' },
  { icon: Printer, text: '58mm & 80mm thermal printing, dual copies' },
  { icon: History, text: 'Full history, search and saved receipts' },
  { icon: FileSpreadsheet, text: 'Excel export of all your records' },
  { icon: ShieldCheck, text: 'Your logo, custom fields and passcode lock' },
  { icon: LifeBuoy, text: 'Priority support' },
];

function PlanCard({ plan, monthly, selected, onSelect }: {
  plan: Plan; monthly: Plan | undefined; selected: boolean; onSelect: () => void;
}) {
  const perMonth = Math.round(plan.price / plan.months);
  const fullPrice = monthly ? monthly.price * plan.months : plan.price;
  const saving = fullPrice - plan.price;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'card-soft card-hover relative flex flex-col items-start gap-3 p-5 text-left outline-none focus-visible:ring-4 focus-visible:ring-primary/30',
        selected && 'border-primary ring-2 ring-primary',
        plan.best_value && !selected && 'border-amber-500/50',
      )}
    >
      {plan.best_value && (
        <span className="absolute -top-3 left-5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow">
          Best value
        </span>
      )}
      <div className="flex w-full items-center justify-between gap-2">
        <p className="text-lg font-bold text-navy">{plan.name}</p>
        <span className={cn(
          'flex h-6 w-6 items-center justify-center rounded-full border-2',
          selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
        )}>
          {selected && <Check className="h-3.5 w-3.5" />}
        </span>
      </div>
      <div>
        <p className="text-3xl font-extrabold text-navy">
          {formatInr(plan.price)}
          <span className="text-sm font-medium text-muted-foreground"> / {plan.months === 1 ? 'month' : `${plan.months} months`}</span>
        </p>
        {plan.months > 1 && (
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="line-through">{formatInr(fullPrice)}</span> · just {formatInr(perMonth)}/month
          </p>
        )}
      </div>
      {saving > 0 ? (
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
          Save {formatInr(saving)}
        </span>
      ) : (
        <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-muted-foreground">Pay month by month</span>
      )}
    </button>
  );
}

function CouponForm() {
  const { redeem, closePaywall } = useSubscription();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const apply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    try {
      const message = await redeem(code);
      toast({ title: '🎉 Coupon applied', description: message });
      setCode('');
      closePaywall();
    } catch (err) {
      toast({ title: 'Could not apply the coupon', description: errorMessage(err), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={apply} className="flex flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <Ticket className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="Have a coupon code?"
          className="h-11 pl-10 font-semibold uppercase tracking-wider"
          maxLength={30}
          aria-label="Coupon code"
        />
      </div>
      <Button type="submit" variant="outline" className="h-11" disabled={busy || !code.trim()}>
        {busy ? 'Applying…' : 'Apply'}
      </Button>
    </form>
  );
}

// Full-screen upgrade screen. It can be closed (X) to keep looking around; creating
// receipts stays locked until there is a plan.
export function UpgradeDialog() {
  const { subscription, plans, paywallOpen, closePaywall } = useSubscription();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);

  const status = subscription?.status;
  const monthly = plans.find(p => p.months === 1);
  const selected = plans.find(p => p.id === selectedId) ?? plans.find(p => p.best_value) ?? plans[0];

  const title = status === 'expired'
    ? (subscription?.plan === 'paid' ? 'Your plan has ended' : 'Your free trial has ended')
    : status === 'none'
      ? 'Choose a plan to start creating receipts'
      : status === 'paid'
        ? 'Extend your plan'
        : 'Upgrade to Quick Receipt Pro';
  const subtitle = status === 'expired' || status === 'none'
    ? 'You can still look around, view and download your past receipts. To create new receipts, pick a plan below.'
    : 'Keep creating receipts without interruption. Any days left on your current plan are added on top.';

  // Online payment is not connected yet: the chosen plan is activated by the team.
  // Replace this with the payment gateway checkout when it is added.
  const startCheckout = (plan: Plan) => setCheckoutPlan(plan);

  const onOpenChange = (open: boolean) => {
    if (!open) {
      closePaywall();
      setCheckoutPlan(null);
    }
  };

  return (
    <DialogPrimitive.Root open={paywallOpen} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          className="fixed inset-0 z-[60] overflow-y-auto bg-canvas outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 no-print"
        >
          <DialogPrimitive.Close
            className="fixed right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border bg-card text-navy shadow-lg transition-all hover:scale-105 hover:bg-accent focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 sm:right-6 sm:top-6"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </DialogPrimitive.Close>

          <div className="mx-auto w-full max-w-5xl px-4 pb-12 pt-16 sm:px-6 sm:pt-20">
            <div className="text-center">
              <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_14px_30px_-12px_rgba(245,158,11,0.8)]">
                <Crown className="h-8 w-8" />
              </span>
              <DialogPrimitive.Title className="text-2xl font-extrabold text-navy sm:text-4xl">{title}</DialogPrimitive.Title>
              <DialogPrimitive.Description className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
                {subtitle}
              </DialogPrimitive.Description>
            </div>

            {plans.length === 0 ? (
              <div className="mt-10 flex justify-center">
                <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              </div>
            ) : (
              <div className="mt-10 grid gap-5 md:grid-cols-3">
                {plans.map(plan => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    monthly={monthly}
                    selected={selected?.id === plan.id}
                    onSelect={() => { setSelectedId(plan.id); setCheckoutPlan(null); }}
                  />
                ))}
              </div>
            )}

            {selected && (
              <div className="mx-auto mt-6 max-w-md">
                <Button className="btn-glow h-12 w-full rounded-full text-base" onClick={() => startCheckout(selected)}>
                  <Sparkles /> Continue with {selected.name} · {formatInr(selected.price)}
                </Button>
                <p className="mt-2 text-center text-xs text-muted-foreground">Prices include all taxes. No auto-renewal.</p>
              </div>
            )}

            {checkoutPlan && (
              <div className="mx-auto mt-6 max-w-xl animate-fade-in-up rounded-2xl border border-primary/25 bg-primary/[0.06] p-5 text-center">
                <p className="font-bold text-navy">Online payment is coming soon</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  To activate the <strong>{checkoutPlan.name}</strong> plan ({formatInr(checkoutPlan.price)}) right now, message our
                  support team and we will switch it on for your account.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => {
                    closePaywall();
                    setCheckoutPlan(null);
                    navigate('/support');
                  }}
                >
                  <LifeBuoy /> Contact support to activate
                </Button>
              </div>
            )}

            <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <div className="card-soft p-5 sm:p-6">
                <p className="mb-4 flex items-center gap-2 font-bold text-navy"><BadgeCheck className="h-5 w-5 text-primary" /> Every plan includes</p>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {features.map(f => (
                    <li key={f.text} className="flex items-start gap-3 text-sm">
                      <span className="icon-tile h-8 w-8 rounded-lg"><f.icon className="h-4 w-4" /></span>
                      <span className="pt-1.5 text-foreground">{f.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card-soft flex flex-col justify-center gap-3 p-5 sm:p-6">
                <p className="flex items-center gap-2 font-bold text-navy"><Ticket className="h-5 w-5 text-primary" /> Got a coupon?</p>
                <p className="text-sm text-muted-foreground">Enter it here to add free days to your account.</p>
                <CouponForm />
              </div>
            </div>

            <div className="mt-8 text-center">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Maybe later, just look around</Button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
