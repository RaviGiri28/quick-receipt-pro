import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, RefreshCw, Ticket } from 'lucide-react';
import { adminApi, errorMessage, type AdminUser, type Coupon } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// No 0/O or 1/I, so a code read out over the phone can't be mistyped.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// e.g. "RAVI-7K3M": the account's first name and four random characters.
function suggestCode(name: string) {
  const base = (name.trim().split(/\s+/)[0] || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || 'USER';
  const random = Array.from(crypto.getRandomValues(new Uint32Array(4)), n => CODE_CHARS[n % CODE_CHARS.length]).join('');
  return `${base}-${random}`;
}

// <input type="date"> value -> end of that day in the admin's time zone.
const fromDateInput = (value: string) => (value ? new Date(`${value}T23:59:59`).toISOString() : null);

function couponStatus(c: Coupon): [string, string] {
  if (c.redeemed) return ['Used', 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'];
  if (!c.is_active) return ['Off', 'bg-muted text-muted-foreground'];
  if (c.expires_at && new Date(c.expires_at).getTime() <= Date.now()) return ['Expired', 'bg-red-500/10 text-red-700 dark:text-red-400'];
  return ['Not used yet', 'bg-sky-500/10 text-sky-700 dark:text-sky-400'];
}

// Manage dialog on the Users page: coupons only this account can use.
export function PersonalCoupons({ user }: { user: AdminUser }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [code, setCode] = useState(() => suggestCode(user.name));
  const [days, setDays] = useState('15');
  const [validUntil, setValidUntil] = useState('');

  const { data: coupons } = useQuery({ queryKey: ['admin', 'coupons'], queryFn: adminApi.listCoupons });
  const mine = (coupons || []).filter(c => c.user_id === user.id);

  const create = useMutation({
    mutationFn: () => adminApi.createCoupon({
      code: code.trim().toUpperCase(),
      trial_days: Number(days),
      audience: 'personal',
      max_uses: 1,
      expires_at: fromDateInput(validUntil),
      is_active: true,
      note: `Personal coupon for ${user.name}`,
      user_id: user.id,
    }),
    onSuccess: (coupon) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      toast({ title: `Coupon ${coupon.code} created`, description: `Share it with ${user.name}. Only this account can use it.` });
      setCode(suggestCode(user.name));
    },
    onError: (err) => toast({ title: 'Could not create the coupon', description: errorMessage(err), variant: 'destructive' }),
  });

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: `Copied ${value}` });
    } catch {
      toast({ title: 'Could not copy', variant: 'destructive' });
    }
  };

  const validDays = Number.isInteger(Number(days)) && Number(days) >= 1 && Number(days) <= 365;
  const validCode = /^[A-Z0-9_-]{3,30}$/.test(code.trim().toUpperCase());

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <p className="flex items-center gap-2 font-semibold text-navy"><Ticket className="h-4 w-4 text-amber-600" /> Personal coupon</p>
      <p className="text-xs text-muted-foreground">
        A code only this account can use, once. Share it with them; they enter it on the Upgrade screen. If their trial is
        still running, the days are added on top.
      </p>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <div className="space-y-1">
          <Label htmlFor="personal-code" className="text-xs">Code</Label>
          <div className="flex gap-1.5">
            <Input
              id="personal-code"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
              maxLength={30}
              className="font-mono font-bold uppercase tracking-wider"
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => setCode(suggestCode(user.name))} aria-label="New random code" title="New random code">
              <RefreshCw />
            </Button>
          </div>
        </div>
        <div className="w-24 space-y-1">
          <Label htmlFor="personal-days" className="text-xs">Free days</Label>
          <Input id="personal-days" type="number" min={1} max={365} value={days} onChange={e => setDays(e.target.value)} />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <Label htmlFor="personal-valid" className="text-xs">Valid until (optional)</Label>
          <Input id="personal-valid" type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
        </div>
        <Button onClick={() => create.mutate()} disabled={create.isPending || !validDays || !validCode}>
          {create.isPending ? 'Creating…' : 'Create coupon'}
        </Button>
      </div>

      {mine.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {mine.map(c => {
            const [label, cls] = couponStatus(c);
            return (
              <li key={c.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                <button
                  type="button"
                  onClick={() => copy(c.code)}
                  className="group inline-flex items-center gap-1.5 font-mono font-bold tracking-wider text-primary"
                  title="Copy code"
                >
                  {c.code}
                  <Copy className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100" />
                </button>
                <span className="text-muted-foreground">{c.trial_days} days</span>
                <span className={cn('ml-auto whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold', cls)}>{label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
