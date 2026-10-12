import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { NotificationBell } from '@/components/NotificationBell';
import { TermsGate } from '@/components/TermsGate';
import { PasscodeLock } from '@/components/PasscodeLock';
import { isUnlocked } from '@/lib/appLock';
import { Logo } from '@/components/brand/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LogOut, Moon, Search, Settings, Sun, User, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative h-10 w-10 rounded-full text-navy hover:bg-accent"
      aria-label="Toggle theme"
    >
      <Sun className={`absolute h-5 w-5 transition-all duration-500 ${theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}`} />
      <Moon className={`absolute h-5 w-5 transition-all duration-500 ${theme === 'dark' ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
    </Button>
  );
}

function HeaderSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  return (
    <form
      className="relative hidden w-full max-w-md md:block"
      onSubmit={e => {
        e.preventDefault();
        navigate(`/history?q=${encodeURIComponent(query.trim())}`);
      }}
    >
      <div className="absolute left-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Search className="h-3.5 w-3.5" />
      </div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search receipts, transactions..."
        className="h-10 w-full rounded-full border border-transparent bg-accent/70 pl-11 pr-4 text-sm outline-none transition-all duration-200 placeholder:text-muted-foreground focus:border-primary/40 focus:bg-card focus:ring-4 focus:ring-primary/10"
      />
    </form>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const initials = user.name.split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'U';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-accent text-sm font-bold text-primary ring-2 ring-primary/15 transition-all duration-200 hover:ring-4 hover:ring-primary/25"
          aria-label="Account menu"
        >
          {user.business.logo ? <img src={user.business.logo} alt="" className="h-full w-full object-cover" /> : initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-xl p-1.5">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate font-semibold text-foreground">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
          <Link to="/profile"><User className="mr-2 h-4 w-4" /> Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
          <Link to="/settings"><Settings className="mr-2 h-4 w-4" /> Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer rounded-lg text-destructive focus:text-destructive"
          onClick={() => { logout(); navigate('/login'); }}
        >
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, sessionError, retrySession, logout } = useAuth();
  // Re-render once the passcode lock is passed (the flag itself lives in sessionStorage).
  const [, setUnlockedNow] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-canvas">
        <Logo markClassName="h-14 w-14 animate-float" textClassName="text-2xl" />
        <div className="h-1 w-40 overflow-hidden rounded-full bg-primary/15">
          <div className="h-full w-1/2 rounded-full bg-primary animate-shimmer" />
        </div>
      </div>
    );
  }

  // Saved session couldn't be checked (server unreachable): offer a retry instead of
  // sending the user to the login page.
  if (!user && sessionError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas p-6 text-center">
        <div className="icon-tile h-16 w-16 rounded-2xl">
          <WifiOff className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-navy">Can't connect to Quick Receipt</h1>
          <p className="mt-1 text-sm text-muted-foreground">{sessionError}</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={retrySession}>Try again</Button>
          <Button variant="outline" onClick={logout}>Log out</Button>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (user.hasPasscode && !isUnlocked(user.id)) {
    return <PasscodeLock onUnlock={() => setUnlockedNow(true)} />;
  }

  return (
    <SidebarProvider style={{ '--sidebar-width': '17rem' } as React.CSSProperties}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex min-w-0 flex-1 flex-col bg-canvas">
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border/60 bg-background/75 px-4 backdrop-blur-xl sm:px-6 no-print">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <SidebarTrigger className="h-10 w-10 shrink-0 rounded-xl text-navy hover:bg-accent [&_svg]:!h-5 [&_svg]:!w-5" />
              <Link to="/" className="md:hidden">
                <Logo markClassName="h-8 w-8" textClassName="text-lg" />
              </Link>
              <HeaderSearch />
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NotificationBell />
              <UserMenu />
            </div>
          </header>
          <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-[1400px]">{children}</div>
          </div>
        </main>
      </div>
      <TermsGate />
    </SidebarProvider>
  );
}
