import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { setSubscriptionRequiredHandler, subscriptionApi, type Plan, type SubscriptionDetails } from '@/lib/api';
import type { Subscription } from '@/types/receipt';

// Longest delay setTimeout accepts (~24.8 days); later expiries are re-checked on reload.
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

interface SubscriptionContextType {
  // Deactivated by an admin: no trial or upgrade popups (the deactivation notice explains it).
  deactivated: boolean;
  // The user's subscription, counted as expired once its end time has passed.
  subscription: Subscription | null;
  canCreate: boolean;
  plans: Plan[];
  offer: SubscriptionDetails['offer'];
  paywallOpen: boolean;
  openPaywall: () => void;
  closePaywall: () => void;
  offerOpen: boolean;
  openOffer: () => void;
  closeOffer: () => void;
  // Applies a coupon code; resolves to the server's message.
  redeem: (code: string) => Promise<string>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

const isRunning = (s: Subscription | null | undefined) => s?.status === 'trial' || s?.status === 'paid';

// Lives above the routes (every page mounts its own AppLayout), so the popups keep their
// state while the user moves between pages. AppLayout renders them.
export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, setSubscription } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  // Bumped when the trial or plan runs out while the app is open.
  const [expiredAt, setExpiredAt] = useState(0);
  const autoShownFor = useRef<number | null>(null);

  const stored = user?.subscription ?? null;
  const deactivated = !!user?.deactivatedAt;
  const expiresMs = stored?.expiresAt ? new Date(stored.expiresAt).getTime() : null;
  const subscription = useMemo<Subscription | null>(() => {
    const ended = isRunning(stored) && expiresMs !== null && expiresMs <= Math.max(Date.now(), expiredAt);
    return stored && ended ? { ...stored, status: 'expired', canCreate: false } : stored;
  }, [stored, expiresMs, expiredAt]);

  const { data: details } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: subscriptionApi.get,
    enabled: !!user && stored?.status !== 'admin',
    staleTime: 5 * 60_000,
  });

  // Ends the trial on screen the moment it runs out, and opens the upgrade screen.
  useEffect(() => {
    if (!isRunning(stored) || expiresMs === null) return;
    const delay = expiresMs - Date.now();
    if (delay <= 0 || delay > MAX_TIMEOUT_MS) return;
    const timer = setTimeout(() => {
      setExpiredAt(Date.now());
      setPaywallOpen(true);
    }, delay + 500);
    return () => clearTimeout(timer);
  }, [stored, expiresMs]);

  // Shown once per app load: the upgrade screen for an ended trial, or the coupon offer
  // for accounts that never had one.
  useEffect(() => {
    // Deactivated accounts get the deactivation popup instead; if the account is reactivated
    // later, these show then.
    if (!user || !subscription || !user.termsAccepted || deactivated || autoShownFor.current === user.id) return;
    if (subscription.status === 'expired') {
      autoShownFor.current = user.id;
      setPaywallOpen(true);
    } else if (subscription.status === 'none' && details) {
      autoShownFor.current = user.id;
      if (details.offer) setOfferOpen(true);
      else setPaywallOpen(true);
    } else if (subscription.status !== 'none') {
      autoShownFor.current = user.id;
    }
  }, [user, subscription, details, deactivated]);

  // Deactivated while a popup was open: close it.
  useEffect(() => {
    if (deactivated) {
      setPaywallOpen(false);
      setOfferOpen(false);
    }
  }, [deactivated]);

  // Links in emails: /?upgrade=1 opens the upgrade screen.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (!user || params.get('upgrade') !== '1') return;
    params.delete('upgrade');
    const search = params.toString();
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: true });
    if (stored?.status !== 'admin') setPaywallOpen(true);
  }, [user, stored?.status, location.pathname, location.search, navigate]);

  // The server refused a receipt (plan ended, maybe on another device): reload and offer an upgrade.
  useEffect(() => {
    setSubscriptionRequiredHandler(() => {
      setPaywallOpen(true);
      queryClient.fetchQuery({ queryKey: ['subscription', user?.id], queryFn: subscriptionApi.get, staleTime: 0 })
        .then(d => setSubscription(d.subscription))
        .catch(() => {});
    });
    return () => setSubscriptionRequiredHandler(null);
  }, [queryClient, setSubscription, user?.id]);

  useEffect(() => {
    if (!user) {
      setPaywallOpen(false);
      setOfferOpen(false);
      autoShownFor.current = null;
    }
  }, [user]);

  const redeem = useCallback(async (code: string) => {
    const result = await subscriptionApi.redeem(code);
    setSubscription(result.subscription);
    setExpiredAt(0);
    queryClient.invalidateQueries({ queryKey: ['subscription'] });
    return result.message;
  }, [queryClient, setSubscription]);

  const value: SubscriptionContextType = {
    deactivated,
    subscription,
    canCreate: subscription ? subscription.canCreate : true,
    plans: details?.plans ?? [],
    offer: details?.offer ?? null,
    paywallOpen: paywallOpen && !deactivated,
    openPaywall: useCallback(() => { setOfferOpen(false); setPaywallOpen(true); }, []),
    closePaywall: useCallback(() => setPaywallOpen(false), []),
    offerOpen: offerOpen && !deactivated,
    openOffer: useCallback(() => { setPaywallOpen(false); setOfferOpen(true); }, []),
    closeOffer: useCallback(() => setOfferOpen(false), []),
    redeem,
  };

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used inside SubscriptionProvider');
  return ctx;
}
