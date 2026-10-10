import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { PublicNav } from '@/components/PublicNav';
import { SiteFooter } from '@/components/SiteFooter';
import type { BlogAudience } from '@/lib/api';

// Pages open to everyone: logged-in users see them inside the app,
// visitors get the public site layout.
export function PublicShell({ active, children }: { active?: string; children: (loggedIn: boolean) => React.ReactNode }) {
  const { user, isLoading, sessionError } = useAuth();
  if (isLoading) return null;
  if (user || sessionError) return <AppLayout>{children(true)}</AppLayout>;

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-canvas text-foreground">
      <PublicNav active={active} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">{children(false)}</main>
      <SiteFooter />
    </div>
  );
}

// /blog is shared: logged-in users read posts for users, visitors read public posts.
export function BlogShell({ children }: { children: (audience: BlogAudience) => React.ReactNode }) {
  return <PublicShell active="Blog">{loggedIn => children(loggedIn ? 'users' : 'public')}</PublicShell>;
}
