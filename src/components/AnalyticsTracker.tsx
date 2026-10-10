import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { setAnalyticsUser, trackPageView } from '@/lib/analytics';

// Sends a page view on every route change and keeps the analytics user in sync with login.
export function AnalyticsTracker() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const userId = user?.id;
  const isAdmin = !!user?.isAdmin;

  useEffect(() => {
    setAnalyticsUser(userId !== undefined ? { id: userId, isAdmin } : null);
  }, [userId, isAdmin]);

  useEffect(() => {
    // Wait a tick so pages that set document.title have done so.
    const t = setTimeout(() => trackPageView(pathname), 0);
    return () => clearTimeout(t);
  }, [pathname]);

  return null;
}
