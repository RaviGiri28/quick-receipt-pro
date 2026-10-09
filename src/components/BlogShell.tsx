import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { PublicNav } from '@/components/PublicNav';
import { Logo } from '@/components/brand/Logo';
import type { BlogAudience } from '@/lib/api';

// /blog is shared: logged-in users read it inside the app (posts for users),
// visitors get the public site layout (posts for the public website).
export function BlogShell({ children }: { children: (audience: BlogAudience) => React.ReactNode }) {
  const { user, isLoading, sessionError } = useAuth();
  if (isLoading) return null;
  if (user || sessionError) return <AppLayout>{children('users')}</AppLayout>;

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-canvas text-foreground">
      <PublicNav active="Blog" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">{children('public')}</main>
      <footer className="border-t border-border/60 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <Logo markClassName="h-8 w-8" textClassName="text-lg" />
          <p>© {new Date().getFullYear()} Quick Receipt. Built for Indian retailers.</p>
        </div>
      </footer>
    </div>
  );
}
