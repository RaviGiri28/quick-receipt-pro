import { useState } from 'react';
import { Copy, Gift, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useToast } from '@/hooks/use-toast';
import { errorMessage } from '@/lib/api';

// For accounts made before subscriptions: shows the free-trial coupon to type in.
export function CouponOfferDialog() {
  const { offer, offerOpen, closeOffer, openPaywall, redeem } = useSubscription();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  if (!offer) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(offer.code);
      toast({ title: 'Code copied', description: 'Paste it in the box below.' });
    } catch {
      setCode(offer.code);
    }
  };

  const apply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    try {
      await redeem(code);
      toast({ title: `🎉 Your ${offer.trial_days}-day free trial has started`, description: 'Enjoy Quick Receipt! We have emailed you the details.' });
      setCode('');
      closeOffer();
    } catch (err) {
      toast({ title: 'Could not apply the code', description: errorMessage(err), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={offerOpen} onOpenChange={o => { if (!o) closeOffer(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader className="items-center text-center sm:text-center">
          <span className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
            <Gift className="h-7 w-7" />
          </span>
          <DialogTitle className="text-2xl">A gift for you: {offer.trial_days} days free!</DialogTitle>
          <DialogDescription>
            Quick Receipt now has paid plans. As a thank you for being with us, enter this code to get a
            free {offer.trial_days}-day trial.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/[0.06] p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your coupon code</p>
            <p className="font-mono text-2xl font-extrabold tracking-widest text-primary">{offer.code}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={copy}><Copy /> Copy</Button>
        </div>

        <form onSubmit={apply} className="space-y-3">
          <div className="relative">
            <Ticket className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="Enter the code here"
              className="h-12 pl-10 font-semibold uppercase tracking-wider"
              maxLength={30}
              aria-label="Coupon code"
              autoFocus
            />
          </div>
          <Button type="submit" className="btn-glow h-12 w-full rounded-full text-base" disabled={busy || !code.trim()}>
            {busy ? 'Starting your trial…' : `Start my ${offer.trial_days}-day free trial`}
          </Button>
        </form>

        <button type="button" onClick={openPaywall} className="text-center text-sm font-semibold text-primary hover:underline">
          See paid plans instead
        </button>
      </DialogContent>
    </Dialog>
  );
}
