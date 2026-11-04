import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IndianRupee } from 'lucide-react';
import { adminApi, errorMessage, type Plan } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState, Spinner } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function PlanCard({ plan }: { plan: Plan }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState(plan.name);
  const [price, setPrice] = useState(String(plan.price));
  const [days, setDays] = useState(String(plan.days));

  const save = useMutation({
    mutationFn: () => adminApi.updatePlan(plan.id, { name: name.trim(), price: Number(price), days: Number(days) }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['public-plans'] });
      toast({ title: 'Plan saved', description: `${updated.name}: ₹${updated.price.toLocaleString('en-IN')} for ${updated.days} days.` });
    },
    onError: (err) => toast({ title: 'Could not save the plan', description: errorMessage(err), variant: 'destructive' }),
  });

  const validPrice = Number.isInteger(Number(price)) && Number(price) >= 1 && Number(price) <= 1000000;
  const validDays = Number.isInteger(Number(days)) && Number(days) >= 1 && Number(days) <= 3650;
  const changed = name.trim() !== plan.name || Number(price) !== plan.price || Number(days) !== plan.days;

  return (
    <form
      className="card-soft space-y-4 p-5"
      onSubmit={e => { e.preventDefault(); save.mutate(); }}
    >
      <div className="space-y-1.5">
        <Label htmlFor={`${plan.id}-name`}>Plan name</Label>
        <Input id={`${plan.id}-name`} value={name} maxLength={50} onChange={e => setName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${plan.id}-price`}>Price (₹, including GST)</Label>
        <Input id={`${plan.id}-price`} type="number" min={1} max={1000000} step={1} value={price} onChange={e => setPrice(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${plan.id}-days`}>Days of access</Label>
        <Input id={`${plan.id}-days`} type="number" min={1} max={3650} step={1} value={days} onChange={e => setDays(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={!changed || !name.trim() || !validPrice || !validDays || save.isPending}>
        {save.isPending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  );
}

export default function AdminPlansPage() {
  const { data: plans, isLoading, isError } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: adminApi.listPlans,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        className="animate-fade-in-up"
        icon={IndianRupee}
        eyebrow="Admin"
        title="Pricing Plans"
        description="Changes apply to new purchases straight away. Plans people have already bought are not affected."
      />

      {isLoading && <Spinner />}
      {!isLoading && (isError || !plans?.length) && (
        <EmptyState
          icon={IndianRupee}
          title={isError ? "Couldn't load plans" : 'No plans found'}
          description={isError ? 'Please try again in a moment.' : 'The plans table is empty.'}
        />
      )}
      {plans && plans.length > 0 && (
        <div className="stagger grid gap-4 md:grid-cols-3">
          {/* Keyed by saved values so the form shows what the server stored after a save. */}
          {plans.map(p => <PlanCard key={`${p.id}-${p.name}-${p.price}-${p.days}`} plan={p} />)}
        </div>
      )}
    </div>
  );
}
