import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Pencil, Plus, Ticket, Trash2, Users, CheckCircle2, TrendingUp } from 'lucide-react';
import {
  adminApi, errorMessage, type Coupon, type CouponAudience, type CouponInput,
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState, Spinner } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

const audiences: { value: CouponAudience; label: string; hint: string }[] = [
  { value: 'signup', label: 'New signups', hint: 'Entered on the signup form.' },
  { value: 'existing', label: 'Existing users', hint: 'Shown in the popup to accounts made before subscriptions.' },
  { value: 'expired', label: 'Trial ended users', hint: 'For users whose free trial or plan has ended: they enter it on the Upgrade screen for a new trial. Each user can use a code once.' },
  { value: 'all', label: 'Everyone', hint: 'Works on the signup form and inside the app.' },
];

const audienceLabel = (c: Coupon) =>
  c.audience === 'personal' ? 'One account' : audiences.find(x => x.value === c.audience)?.label ?? c.audience;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// <input type="date"> value <-> end of that day in the admin's time zone.
const toDateInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const fromDateInput = (value: string) => (value ? new Date(`${value}T23:59:59`).toISOString() : null);

interface FormState {
  code: string;
  trialDays: string;
  audience: CouponAudience;
  maxUses: string;
  expiresOn: string;
  isActive: boolean;
  note: string;
}

const emptyForm: FormState = { code: '', trialDays: '15', audience: 'signup', maxUses: '', expiresOn: '', isActive: true, note: '' };

const formFromCoupon = (c: Coupon): FormState => ({
  code: c.code,
  trialDays: String(c.trial_days),
  audience: c.audience,
  maxUses: c.max_uses ? String(c.max_uses) : '',
  expiresOn: toDateInput(c.expires_at),
  isActive: c.is_active,
  note: c.note || '',
});

function couponState(c: Coupon): [string, string] {
  if (!c.is_active) return ['Off', 'bg-muted text-muted-foreground'];
  if (c.expires_at && new Date(c.expires_at).getTime() <= Date.now()) return ['Expired', 'bg-red-500/10 text-red-700 dark:text-red-400'];
  if (c.max_uses !== null && c.used_count >= c.max_uses) return ['Used up', 'bg-amber-500/10 text-amber-700 dark:text-amber-400'];
  return ['Live', 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'];
}

function StatTile({ icon: Icon, label, value, className }: {
  icon: typeof Users; label: string; value: number | string | undefined; className: string;
}) {
  return (
    <div className="card-soft flex items-center gap-4 p-4">
      <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl', className)}><Icon className="h-5 w-5" /></span>
      <div>
        <p className="text-2xl font-extrabold text-navy">{value ?? '–'}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function AdminCouponsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Coupon | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleting, setDeleting] = useState<Coupon | null>(null);

  const { data: coupons, isLoading, isError } = useQuery({
    queryKey: ['admin', 'coupons'],
    queryFn: adminApi.listCoupons,
  });

  const done = (title: string) => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    toast({ title });
  };

  const save = useMutation({
    mutationFn: ({ id, data }: { id: number | null; data: CouponInput }) =>
      id ? adminApi.updateCoupon(id, data) : adminApi.createCoupon(data),
    onSuccess: (coupon, { id }) => {
      setEditing(null);
      done(id ? `Coupon ${coupon.code} updated` : `Coupon ${coupon.code} created`);
    },
    onError: (err) => toast({ title: 'Could not save the coupon', description: errorMessage(err), variant: 'destructive' }),
  });

  const toggle = useMutation({
    mutationFn: (c: Coupon) => adminApi.updateCoupon(c.id, {
      code: c.code, trial_days: c.trial_days, audience: c.audience, max_uses: c.max_uses,
      expires_at: c.expires_at, is_active: !c.is_active, note: c.note,
    }),
    onSuccess: (c) => done(c.is_active ? `${c.code} is live again` : `${c.code} switched off`),
    onError: (err) => toast({ title: 'Could not change the coupon', description: errorMessage(err), variant: 'destructive' }),
  });

  const remove = useMutation({
    mutationFn: (c: Coupon) => adminApi.deleteCoupon(c.id),
    onSuccess: () => done('Coupon deleted'),
    onError: (err) => toast({ title: 'Could not delete the coupon', description: errorMessage(err), variant: 'destructive' }),
  });

  const openNew = () => { setForm(emptyForm); setEditing('new'); };
  const openEdit = (c: Coupon) => { setForm(formFromCoupon(c)); setEditing(c); };
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(prev => ({ ...prev, [key]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const days = Number(form.trialDays);
    const maxUses = form.maxUses.trim() ? Number(form.maxUses) : null;
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      toast({ title: 'Trial days must be a whole number from 1 to 365', variant: 'destructive' });
      return;
    }
    if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) {
      toast({ title: 'Max uses must be a whole number, or empty for unlimited', variant: 'destructive' });
      return;
    }
    save.mutate({
      id: editing && editing !== 'new' ? editing.id : null,
      data: {
        code: form.code.trim().toUpperCase(),
        trial_days: days,
        audience: form.audience,
        max_uses: maxUses,
        expires_at: fromDateInput(form.expiresOn),
        is_active: form.isActive,
        note: form.note.trim() || null,
      },
    });
  };

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({ title: `Copied ${code}` });
    } catch {
      toast({ title: 'Could not copy', variant: 'destructive' });
    }
  };

  const list = coupons || [];
  const totalUses = list.reduce((sum, c) => sum + c.used_count, 0);
  const totalConverted = list.reduce((sum, c) => sum + c.converted_count, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        className="animate-fade-in-up"
        icon={Ticket}
        eyebrow="Admin"
        title="Coupons"
        description="Codes that give a free trial. New signups get 7 days without a code. For one account, use Users > Manage."
        actions={<Button onClick={openNew}><Plus /> New coupon</Button>}
      />

      <div className="stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={Ticket} label="Coupons" value={coupons ? list.length : undefined} className="bg-primary/15 text-primary" />
        <StatTile icon={CheckCircle2} label="Live now" value={coupons ? list.filter(c => couponState(c)[0] === 'Live').length : undefined} className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" />
        <StatTile icon={Users} label="Times used" value={coupons ? totalUses : undefined} className="bg-sky-500/15 text-sky-700 dark:text-sky-400" />
        <StatTile
          icon={TrendingUp}
          label="Became paid"
          value={coupons ? `${totalConverted}${totalUses ? ` (${Math.round((totalConverted / totalUses) * 100)}%)` : ''}` : undefined}
          className="bg-amber-500/15 text-amber-700 dark:text-amber-400"
        />
      </div>

      <section className="card-soft animate-fade-in-up space-y-4 p-5 sm:p-6">
        {isLoading && <Spinner />}
        {!isLoading && (isError || list.length === 0) && (
          <EmptyState
            icon={Ticket}
            title={isError ? "Couldn't load coupons" : 'No coupons yet'}
            description={isError ? 'Please try again in a moment.' : 'Create a coupon to give people a longer free trial.'}
          />
        )}
        {list.length > 0 && (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-accent/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Free days</th>
                  <th className="px-4 py-3">For</th>
                  <th className="px-4 py-3">Used</th>
                  <th className="px-4 py-3">Became paid</th>
                  <th className="px-4 py-3">Valid until</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">On</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {list.map(c => {
                  const [label, cls] = couponState(c);
                  return (
                    <tr key={c.id} className="transition-colors hover:bg-accent/30">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => copy(c.code)}
                          className="group inline-flex items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/[0.06] px-2.5 py-1 font-mono font-bold tracking-wider text-primary"
                          title="Copy code"
                        >
                          {c.code}
                          <Copy className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100" />
                        </button>
                        {c.note && <p className="mt-1 max-w-[220px] truncate text-xs text-muted-foreground" title={c.note}>{c.note}</p>}
                      </td>
                      <td className="px-4 py-3 font-semibold text-navy">{c.trial_days} days</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {audienceLabel(c)}
                        {c.audience === 'personal' && c.user_name && (
                          <p className="max-w-[200px] truncate text-xs font-medium text-navy" title={c.user_email ?? undefined}>{c.user_name}</p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-navy">
                        {c.used_count}{c.max_uses !== null && <span className="font-normal text-muted-foreground"> / {c.max_uses}</span>}
                      </td>
                      <td className="px-4 py-3 text-navy">{c.converted_count}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{c.expires_at ? formatDate(c.expires_at) : 'No end date'}</td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', cls)}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />{label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Switch
                          checked={c.is_active}
                          onCheckedChange={() => toggle.mutate(c)}
                          disabled={toggle.isPending && toggle.variables?.id === c.id}
                          aria-label={`${c.is_active ? 'Switch off' : 'Switch on'} ${c.code}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(c)} aria-label={`Edit ${c.code}`}><Pencil /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleting(c)} aria-label={`Delete ${c.code}`}><Trash2 /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog open={!!editing} onOpenChange={o => { if (!o) setEditing(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? 'New coupon' : `Edit ${editing?.code ?? ''}`}</DialogTitle>
            <DialogDescription>People who enter this code get a free trial of the days you set.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="coupon-code">Code</Label>
                <Input
                  id="coupon-code"
                  value={form.code}
                  onChange={e => update('code', e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                  placeholder="DIWALI30"
                  maxLength={30}
                  className="font-mono font-bold uppercase tracking-wider"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="coupon-days">Free trial days</Label>
                <Input id="coupon-days" type="number" min={1} max={365} value={form.trialDays} onChange={e => update('trialDays', e.target.value)} required />
              </div>
            </div>
            {form.audience === 'personal' ? (
              <div className="space-y-1.5">
                <Label>Who can use it</Label>
                <p className="rounded-xl border bg-accent/40 px-3 py-2.5 text-sm">
                  Only <strong>{editing && editing !== 'new' ? editing.user_name : ''}</strong>
                  <span className="text-muted-foreground"> ({editing && editing !== 'new' ? editing.user_email : ''})</span>
                </p>
              </div>
            ) : (
            <div className="space-y-1.5">
              <Label>Who can use it</Label>
              <Select value={form.audience} onValueChange={v => update('audience', v as CouponAudience)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {audiences.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{audiences.find(a => a.value === form.audience)?.hint}</p>
            </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="coupon-max">Max uses</Label>
                <Input id="coupon-max" type="number" min={1} value={form.maxUses} onChange={e => update('maxUses', e.target.value)} placeholder="Unlimited" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="coupon-expires">Valid until</Label>
                <Input id="coupon-expires" type="date" value={form.expiresOn} onChange={e => update('expiresOn', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coupon-note">Note (only you see this)</Label>
              <Input id="coupon-note" value={form.note} onChange={e => update('note', e.target.value)} placeholder="e.g. Given to Ramesh Traders" maxLength={255} />
            </div>
            <label className="flex cursor-pointer items-center justify-between rounded-xl border bg-accent/40 p-3 text-sm">
              <span className="font-medium text-navy">Coupon is on</span>
              <Switch checked={form.isActive} onCheckedChange={v => update('isActive', v)} />
            </label>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save coupon'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={o => { if (!o) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              Nobody will be able to use this code any more. Trials already started with it keep running. To pause a code
              instead, switch it off.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleting) remove.mutate(deleting); setDeleting(null); }}
            >
              Delete coupon
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
