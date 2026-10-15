import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Search, ShieldAlert, ShieldCheck, UserPlus, Users } from 'lucide-react';
import {
  adminApi, assetUrl, errorMessage, type AdminUser, type AdminUserStatusFilter,
} from '@/lib/api';
import { useDebounce } from '@/hooks/use-debounce';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState, Spinner } from '@/components/EmptyState';
import { Pager } from '@/components/Pager';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

const filters: { value: AdminUserStatusFilter; label: string }[] = [
  { value: 'all', label: 'All users' },
  { value: 'active', label: 'Active' },
  { value: 'deactivated', label: 'Deactivated' },
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

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
  const [page, setPage] = useState(1);
  const [confirming, setConfirming] = useState<AdminUser | null>(null);
  const debouncedSearch = useDebounce(search.trim(), 350);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'users', debouncedSearch, status, page],
    queryFn: () => adminApi.listUsers({ search: debouncedSearch, status, page, limit: PAGE_SIZE }),
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

  return (
    <div className="space-y-6">
      <PageHeader
        className="animate-fade-in-up"
        icon={Users}
        eyebrow="Admin"
        title="Users"
        description="Everyone who has signed up. Deactivate an account to stop it creating receipts."
      />

      <div className="stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={Users} label="Total users" value={data?.stats.total} className="bg-primary/15 text-primary" />
        <StatTile icon={ShieldCheck} label="Active" value={data?.stats.active} className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" />
        <StatTile icon={ShieldAlert} label="Deactivated" value={data?.stats.deactivated} className="bg-amber-500/15 text-amber-700 dark:text-amber-400" />
        <StatTile icon={UserPlus} label="New this week" value={data?.stats.new_this_week} className="bg-sky-500/15 text-sky-700 dark:text-sky-400" />
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
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-accent/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Business</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Last active</th>
                  <th className="px-4 py-3 text-right">Receipts</th>
                  <th className="px-4 py-3">Status</th>
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
                        <StatusBadge user={u} />
                        {u.deactivated_at && (
                          <p className="mt-1 text-[11px] text-muted-foreground">since {formatDate(u.deactivated_at)}</p>
                        )}
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
