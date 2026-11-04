import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Check, Clock, Copy, Crown, KeyRound, Search, ShieldAlert, ShieldCheck, TimerOff, UserPlus, Users } from 'lucide-react';
import {
  adminApi, assetUrl, errorMessage, type AdminPlanAction, type AdminPlanFilter, type AdminUser, type AdminUserStatusFilter, type Plan,
} from '@/lib/api';
import { useDebounce } from '@/hooks/use-debounce';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState, Spinner } from '@/components/EmptyState';
import { Pager } from '@/components/Pager';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { PersonalCoupons } from './PersonalCoupons';

const PAGE_SIZE = 20;

const filters: { value: AdminUserStatusFilter; label: string }[] = [
  { value: 'all', label: 'All users' },
  { value: 'active', label: 'Active' },
  { value: 'deactivated', label: 'Deactivated' },
];

const planFilters: { value: AdminPlanFilter; label: string }[] = [
  { value: 'all', label: 'Any plan' },
  { value: 'trial', label: 'On trial' },
  { value: 'paid', label: 'Paid' },
  { value: 'expired', label: 'Expired' },
  { value: 'none', label: 'No plan yet' },
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

function PlanBadge({ user, plans }: { user: AdminUser; plans: Plan[] }) {
  const s = user.subscription;
  const planName = plans.find(p => p.id === s.plan_id)?.name;
  const [label, className] = s.status === 'admin'
    ? ['Admin', 'bg-primary/10 text-primary']
    : s.status === 'paid'
      ? [`Paid${planName ? ` · ${planName}` : ''}`, 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400']
      : s.status === 'trial'
        ? ['Trial', 'bg-sky-500/10 text-sky-700 dark:text-sky-400']
        : s.status === 'expired'
          ? [s.plan === 'paid' ? 'Plan ended' : 'Trial ended', 'bg-red-500/10 text-red-700 dark:text-red-400']
          : [user.trial_days_pending ? `${user.trial_days_pending}-day trial (not logged in yet)` : 'No plan', 'bg-muted text-muted-foreground'];
  return (
    <div>
      <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold', className)}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {label}
      </span>
      {s.expires_at && s.status !== 'admin' && (
        <p className="mt-1 whitespace-nowrap text-[11px] text-muted-foreground">
          {s.status === 'expired' ? 'ended' : 'until'} {formatDateTime(s.expires_at)}
        </p>
      )}
    </div>
  );
}

function PlanDialog({ user, plans, onClose }: { user: AdminUser | null; plans: Plan[]; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [planId, setPlanId] = useState('');
  const [days, setDays] = useState('7');

  const change = useMutation({
    mutationFn: (action: AdminPlanAction) => adminApi.setUserPlan(user!.id, action),
    onSuccess: ({ message, user: updated }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({
        title: message,
        description: updated.subscription.expires_at
          ? `${updated.name}: ${updated.subscription.status === 'expired' ? 'ended' : 'active until'} ${formatDateTime(updated.subscription.expires_at)}.`
          : undefined,
      });
      onClose();
    },
    onError: (err) => toast({ title: 'Could not change the plan', description: errorMessage(err), variant: 'destructive' }),
  });

  const selectedPlan = plans.find(p => p.id === planId) ?? plans[0];
  const running = user && (user.subscription.status === 'trial' || user.subscription.status === 'paid');

  return (
    <Dialog open={!!user} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="max-h-[92vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage · {user?.name}</DialogTitle>
          <DialogDescription>{user?.email}</DialogDescription>
        </DialogHeader>
        {user && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Current: <PlanBadge user={user} plans={plans} />
          </div>
        )}

        <div className="space-y-3 rounded-xl border p-4">
          <p className="flex items-center gap-2 font-semibold text-navy"><Crown className="h-4 w-4 text-emerald-600" /> Activate a paid plan</p>
          <p className="text-xs text-muted-foreground">For payments received directly (cash / UPI). Days left on the current plan are kept.</p>
          <div className="flex gap-2">
            <Select value={selectedPlan?.id ?? ''} onValueChange={setPlanId}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Choose plan" /></SelectTrigger>
              <SelectContent>
                {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name} · ₹{p.price.toLocaleString('en-IN')} · {p.days} days</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              disabled={!selectedPlan || change.isPending}
              onClick={() => selectedPlan && change.mutate({ action: 'grant_paid', plan_id: selectedPlan.id })}
            >
              Activate
            </Button>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border p-4">
          <Label htmlFor="trial-days" className="flex items-center gap-2 font-semibold text-navy"><Clock className="h-4 w-4 text-sky-600" /> Add free trial days</Label>
          <div className="flex gap-2">
            <Input id="trial-days" type="number" min={1} max={365} value={days} onChange={e => setDays(e.target.value)} className="flex-1" />
            <Button
              variant="outline"
              disabled={change.isPending || !(Number(days) >= 1 && Number(days) <= 365)}
              onClick={() => change.mutate({ action: 'add_trial', days: Number(days) })}
            >
              Add days
            </Button>
          </div>
        </div>

        {running && (
          <Button
            variant="outline"
            className="w-full border-red-500/40 text-red-700 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400"
            disabled={change.isPending}
            onClick={() => change.mutate({ action: 'expire' })}
          >
            <TimerOff /> End the current {user?.subscription.status === 'paid' ? 'plan' : 'trial'} now
          </Button>
        )}

        {user && <PersonalCoupons user={user} />}
      </DialogContent>
    </Dialog>
  );
}

// No look-alike characters (0/O, 1/l/I), because the password is passed on to the user by hand.
const generatePassword = () => {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  // 224 is a multiple of chars.length (56), so every character is equally likely.
  const bytes = crypto.getRandomValues(new Uint8Array(32)).filter(b => b < 224).slice(0, 12);
  return Array.from(bytes, b => chars[b % chars.length]).join('');
};

function ResetPasswordDialog({ user, onClose }: { user: AdminUser | null; onClose: () => void }) {
  const { toast } = useToast();
  const [password, setPassword] = useState(generatePassword);
  const [copied, setCopied] = useState(false);

  const reset = useMutation({
    mutationFn: () => adminApi.resetUserPassword(user!.id, password),
    onError: (err) => toast({ title: 'Could not reset the password', description: errorMessage(err), variant: 'destructive' }),
  });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      toast({ title: 'Could not copy', description: 'Please select the password and copy it yourself.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reset password · {user?.name}</DialogTitle>
          <DialogDescription>{user?.email}</DialogDescription>
        </DialogHeader>

        {reset.isSuccess ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Password reset. Share it with the user now.</p>
            <div className="flex gap-2">
              <Input readOnly value={password} className="font-mono" aria-label="New password" onFocus={e => e.target.select()} />
              <Button type="button" variant="outline" onClick={copy}>
                {copied ? <Check /> : <Copy />} {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              It will not be shown again. Ask them to change it in their Profile after logging in.
            </p>
            <Button type="button" className="w-full" onClick={onClose}>Done</Button>
          </div>
        ) : (
          <form className="space-y-3" onSubmit={e => { e.preventDefault(); reset.mutate(); }}>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New password</Label>
              <div className="flex gap-2">
                <Input
                  id="new-password"
                  value={password}
                  minLength={6}
                  maxLength={72}
                  autoComplete="off"
                  className="font-mono"
                  onChange={e => setPassword(e.target.value)}
                />
                <Button type="button" variant="outline" onClick={() => setPassword(generatePassword())}>Generate</Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Their old password stops working and they are signed out on all devices. They get an email saying the
              password was reset, but it does not include the new password.
            </p>
            <Button type="submit" className="w-full" disabled={password.length < 6 || password.length > 72 || reset.isPending}>
              <KeyRound /> {reset.isPending ? 'Resetting…' : 'Reset password'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatusBadge({ user }: { user: AdminUser }) {
  const [label, className] = user.deletion_requested_at
    ? ['Deleted', 'bg-muted text-muted-foreground']
    : user.deactivated_at
      ? ['Deactivated', 'bg-amber-500/10 text-amber-700 dark:text-amber-400']
      : ['Active', 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function UserAvatar({ user }: { user: AdminUser }) {
  const logo = assetUrl(user.business_logo);
  const initials = user.name.split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'U';
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-sm font-bold text-primary">
      {logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : initials}
    </span>
  );
}

function StatTile({ icon: Icon, label, value, className }: {
  icon: typeof Users; label: string; value: number | undefined; className: string;
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

export default function AdminUsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AdminUserStatusFilter>('all');
  const [plan, setPlan] = useState<AdminPlanFilter>('all');
  const [managing, setManaging] = useState<AdminUser | null>(null);
  const [resetting, setResetting] = useState<AdminUser | null>(null);
  const [page, setPage] = useState(1);
  const [confirming, setConfirming] = useState<AdminUser | null>(null);
  const debouncedSearch = useDebounce(search.trim(), 350);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'users', debouncedSearch, status, plan, page],
    queryFn: () => adminApi.listUsers({ search: debouncedSearch, status, plan, page, limit: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  const toggle = useMutation({
    mutationFn: ({ id, deactivated }: { id: number; deactivated: boolean }) => adminApi.setUserDeactivated(id, deactivated),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({
        title: user.deactivated_at ? 'Account deactivated' : 'Account reactivated',
        description: user.deactivated_at
          ? `${user.name} can no longer create receipts and has been notified.`
          : `${user.name} can create receipts again and has been notified.`,
      });
    },
    onError: (err) => toast({ title: 'Could not change the account', description: errorMessage(err), variant: 'destructive' }),
  });

  const onToggle = (user: AdminUser, deactivate: boolean) => {
    if (deactivate) setConfirming(user);
    else toggle.mutate({ id: user.id, deactivated: false });
  };

  const users = data?.users || [];
  const plans = data?.plans || [];

  return (
    <div className="space-y-6">
      <PageHeader
        className="animate-fade-in-up"
        icon={Users}
        eyebrow="Admin"
        title="Users"
        description="Everyone who has signed up, their trial or plan, and account status."
      />

      <div className="stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={Users} label="Total users" value={data?.stats.total} className="bg-primary/15 text-primary" />
        <StatTile icon={ShieldCheck} label="Active" value={data?.stats.active} className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" />
        <StatTile icon={ShieldAlert} label="Deactivated" value={data?.stats.deactivated} className="bg-amber-500/15 text-amber-700 dark:text-amber-400" />
        <StatTile icon={UserPlus} label="New this week" value={data?.stats.new_this_week} className="bg-sky-500/15 text-sky-700 dark:text-sky-400" />
      </div>
      <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile icon={Clock} label="On free trial" value={data?.stats.on_trial} className="bg-sky-500/15 text-sky-700 dark:text-sky-400" />
        <StatTile icon={Crown} label="Paid" value={data?.stats.paid} className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" />
        <StatTile icon={TimerOff} label="Trial / plan ended" value={data?.stats.expired} className="bg-red-500/15 text-red-700 dark:text-red-400" />
      </div>

      <section className="card-soft animate-fade-in-up space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, email, business or phone..."
              className="h-11 pl-10"
              aria-label="Search users"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map(f => (
              <button
                key={f.value}
                type="button"
                onClick={() => { setStatus(f.value); setPage(1); }}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200',
                  status === f.value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {planFilters.map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => { setPlan(f.value); setPage(1); }}
              className={cn(
                'rounded-full border px-3.5 py-1 text-xs font-semibold transition-all duration-200',
                plan === f.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading && <Spinner />}
        {!isLoading && (isError || users.length === 0) && (
          <EmptyState
            icon={Users}
            title={isError ? "Couldn't load users" : 'No users found'}
            description={isError ? 'Please try again in a moment.' : 'Try a different search or filter.'}
          />
        )}

        {users.length > 0 && (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[1220px] text-sm">
              <thead className="bg-accent/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Business</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Last active</th>
                  <th className="px-4 py-3 text-right">Receipts</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Password</th>
                  <th className="px-4 py-3 text-center">Deactivate</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map(u => {
                  const busy = toggle.isPending && toggle.variables?.id === u.id;
                  return (
                    <tr key={u.id} className={cn('transition-colors hover:bg-accent/30', u.deactivated_at && 'bg-amber-500/[0.04]')}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={u} />
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 font-semibold text-navy">
                              <span className="truncate">{u.name}</span>
                              {u.is_admin && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">Admin</span>}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-navy">{u.business_name}</p>
                        <p className="text-xs text-muted-foreground">{u.phone_number}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(u.created_at)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {u.last_active_at ? formatDistanceToNow(new Date(u.last_active_at), { addSuffix: true }) : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-navy">{u.receipt_count}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <PlanBadge user={u} plans={plans} />
                          {!u.is_admin && (
                            <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs" onClick={() => setManaging(u)}>
                              Manage
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge user={u} />
                        {u.deactivated_at && (
                          <p className="mt-1 text-[11px] text-muted-foreground">since {formatDate(u.deactivated_at)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2.5 text-xs"
                          disabled={u.is_admin || !!u.deletion_requested_at}
                          title={u.is_admin ? 'Admin passwords cannot be reset here' : undefined}
                          onClick={() => setResetting(u)}
                        >
                          Reset
                        </Button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Switch
                          checked={!!u.deactivated_at}
                          onCheckedChange={v => onToggle(u, v)}
                          disabled={u.is_admin || busy}
                          aria-label={`${u.deactivated_at ? 'Reactivate' : 'Deactivate'} ${u.name}`}
                          title={u.is_admin ? 'Admin accounts cannot be deactivated' : undefined}
                          className="data-[state=checked]:bg-amber-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {data && (
          <Pager
            page={page}
            totalPages={data.pagination.totalPages}
            total={data.pagination.total}
            onPageChange={setPage}
            label="users"
          />
        )}
      </section>

      <PlanDialog key={managing?.id ?? 'none'} user={managing} plans={plans} onClose={() => setManaging(null)} />
      <ResetPasswordDialog key={`reset-${resetting?.id ?? 'none'}`} user={resetting} onClose={() => setResetting(null)} />

      <AlertDialog open={!!confirming} onOpenChange={o => { if (!o) setConfirming(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {confirming?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirming?.email} will no longer be able to create or edit receipts. They can still log in, view their past
              receipts and download their data. They will see a notification and a popup about it. You can reactivate the
              account at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-600 text-white hover:bg-amber-700"
              onClick={() => {
                if (confirming) toggle.mutate({ id: confirming.id, deactivated: true });
                setConfirming(null);
              }}
            >
              Deactivate account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
