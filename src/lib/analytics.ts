import type { Analytics } from 'firebase/analytics';

// Firebase Analytics (Google Analytics 4). Off unless the VITE_FIREBASE_* values are set,
// and off in local dev unless VITE_ANALYTICS_IN_DEV=true, so test clicks don't pollute reports.
//
// Privacy: receipts hold customers' bank details, so events never carry receipt data,
// names, emails or amounts. Page addresses are sent without their query string (History
// search terms live there) and with numeric ids replaced by ":id".

type EventParams = Record<string, string | number | boolean>;

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const analyticsConfigured = Boolean(config.apiKey && config.projectId && config.appId && config.measurementId);
const enabledHere = analyticsConfigured && (import.meta.env.PROD || import.meta.env.VITE_ANALYTICS_IN_DEV === 'true');

// ---------------------------------------------------------------------------
// Opt-out (per device, from Settings)
// ---------------------------------------------------------------------------

const OPT_OUT_KEY = 'qr_analytics_opt_out';

export function isAnalyticsOptedOut(): boolean {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === '1';
  } catch {
    return false;
  }
}

export function setAnalyticsOptOut(optOut: boolean) {
  try {
    if (optOut) localStorage.setItem(OPT_OUT_KEY, '1');
    else localStorage.removeItem(OPT_OUT_KEY);
  } catch {
    // Storage unavailable: the choice applies to this visit only.
  }
  void load().then(async a => {
    if (!a) return;
    const { setAnalyticsCollectionEnabled } = await import('firebase/analytics');
    setAnalyticsCollectionEnabled(a, !optOut);
  });
}

// ---------------------------------------------------------------------------
// Loading: Firebase is fetched lazily so it never delays the first render.
// ---------------------------------------------------------------------------

let loading: Promise<Analytics | null> | null = null;

function load(): Promise<Analytics | null> {
  if (!enabledHere) return Promise.resolve(null);
  loading ??= (async () => {
    try {
      const [{ initializeApp }, { initializeAnalytics, isSupported, setAnalyticsCollectionEnabled }] = await Promise.all([
        import('firebase/app'),
        import('firebase/analytics'),
      ]);
      // Unsupported (e.g. cookies blocked, some private windows): stay silent.
      if (!(await isSupported())) return null;
      const app = initializeApp(config);
      // Page views are sent by trackPageView with a cleaned address, not automatically.
      const analytics = initializeAnalytics(app, { config: { send_page_view: false } });
      if (isAnalyticsOptedOut()) setAnalyticsCollectionEnabled(analytics, false);
      return analytics;
    } catch (err) {
      console.warn('Analytics unavailable:', err);
      return null;
    }
  })();
  return loading;
}

// ---------------------------------------------------------------------------
// Tracking
// ---------------------------------------------------------------------------

// "/edit/123" -> "/edit/:id"; blog slugs and other paths are kept.
export function cleanPath(pathname: string): string {
  return pathname.replace(/\/\d+(?=\/|$)/g, '/:id') || '/';
}

export function trackEvent(name: string, params?: EventParams) {
  if (!enabledHere || isAnalyticsOptedOut()) return;
  void load().then(async a => {
    if (!a) return;
    const { logEvent } = await import('firebase/analytics');
    logEvent(a, name, params);
  });
}

export function trackPageView(pathname: string) {
  if (!enabledHere || isAnalyticsOptedOut()) return;
  const path = cleanPath(pathname);
  void load().then(async a => {
    if (!a) return;
    const { logEvent, setDefaultEventParameters } = await import('firebase/analytics');
    const page = { page_location: window.location.origin + path, page_path: path, page_title: document.title };
    // Every later event inherits the cleaned address instead of the real URL.
    setDefaultEventParameters(page);
    logEvent(a, 'page_view', page);
  });
}

// Links events to the account by its numeric id only (no email or name), so reports can
// count active shops. account_type lets you filter out your own admin activity.
export function setAnalyticsUser(user: { id: number; isAdmin: boolean } | null) {
  if (!enabledHere) return;
  void load().then(async a => {
    if (!a) return;
    const { setUserId, setUserProperties } = await import('firebase/analytics');
    setUserId(a, user ? String(user.id) : null);
    setUserProperties(a, { account_type: user ? (user.isAdmin ? 'admin' : 'user') : 'visitor' });
  });
}
