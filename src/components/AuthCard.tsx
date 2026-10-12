import { Link } from 'react-router-dom';
import { Moon, Sun, type LucideIcon } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { AuthBackground } from '@/components/AuthDecor';
import { LegalLinks } from '@/components/SiteFooter';
import { useTheme } from '@/contexts/ThemeContext';

// Centred card on the auth background, for the smaller auth screens (forgot/reset password).
export function AuthCard({ icon: Icon, title, description, children }: {
  icon: LucideIcon;
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
}) {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas">
      <AuthBackground />
      <button
        onClick={toggleTheme}
        className="absolute right-4 top-4 z-20 rounded-full p-2.5 text-navy transition-colors hover:bg-accent"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
      <div className="relative mx-auto flex min-h-screen w-full max-w-[480px] flex-col justify-center px-4 py-10">
        <Link to="/landing" className="mb-8 flex justify-center"><Logo markClassName="h-12 w-12" textClassName="text-2xl" /></Link>
        <div className="card-soft animate-fade-in-up rounded-3xl p-7 shadow-[0_30px_80px_-30px_hsl(var(--shadow-color)/0.35)] sm:p-9">
          <div className="text-center">
            <div className="icon-tile mx-auto h-16 w-16 rounded-2xl"><Icon className="h-8 w-8" /></div>
            <h1 className="mt-5 text-2xl font-extrabold text-navy sm:text-3xl">{title}</h1>
            <p className="mt-1.5 text-muted-foreground">{description}</p>
          </div>
          <div className="mt-7">{children}</div>
        </div>
        <LegalLinks className="mt-5 text-muted-foreground" />
      </div>
    </div>
  );
}
