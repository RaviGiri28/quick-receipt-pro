import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { subscriptionApi } from '@/lib/api';
import { cn, formatInr } from '@/lib/utils';

// Public pricing on the landing page. Prices come from the backend (config/plans.js).
export function PricingSection() {
  const navigate = useNavigate();
  const { data, isError } = useQuery({
    queryKey: ['public-plans'],
    queryFn: subscriptionApi.publicPlans,
    staleTime: 5 * 60_000,
  });
  const plans = data?.plans ?? [];
  const monthly = plans.find(p => p.months === 1);

  if (isError) {
    return <p className="text-center text-muted-foreground">Could not load prices. Please refresh the page.</p>;
  }
  if (!data) {
    return (
      <div className="flex justify-center py-10">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map(plan => {
          const fullPrice = monthly ? monthly.price * plan.months : plan.price;
          const saving = fullPrice - plan.price;
          return (
            <div
              key={plan.id}
              className={cn('card-soft relative flex flex-col gap-3 p-6', plan.best_value && 'border-amber-500/60')}
            >
              {plan.best_value && (
                <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow">
                  Best value
                </span>
              )}
              <h3 className="text-lg font-bold text-navy">{plan.name}</h3>
              <p className="text-4xl font-extrabold text-navy">{formatInr(plan.price)}</p>
              <p className="text-sm text-muted-foreground">
                {plan.days} days of access
                {plan.months > 1 && ` · ${formatInr(Math.round(plan.price / plan.months))}/month`}
              </p>
              <p className="min-h-5 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                {saving > 0 ? `Save ${formatInr(saving)}` : ''}
              </p>
              <Button
                className="mt-auto"
                variant={plan.best_value ? 'default' : 'outline'}
                onClick={() => navigate('/signup')}
              >
                Start free trial
              </Button>
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Start with a {data.trial_days}-day free trial. Prices include all taxes. Plans do not renew automatically.{' '}
        <Link to="/refund-policy" className="font-medium text-primary hover:underline">Refund &amp; Cancellation Policy</Link>
      </p>
    </>
  );
}
