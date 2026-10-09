import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/Logo';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

const links = [
  { label: 'Home', href: '/landing#home' },
  { label: 'Features', href: '/landing#features' },
  { label: 'How It Works', href: '/landing#how-it-works' },
  { label: 'FAQ', href: '/landing#faq' },
  { label: 'Blog', href: '/blog' },
];

// Top navigation for the public pages (landing and sign up).
export function PublicNav({ active }: { active?: string }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled ? 'border-b border-border/60 bg-background/80 shadow-[0_8px_30px_-20px_hsl(var(--shadow-color)/0.5)] backdrop-blur-xl' : 'bg-transparent',
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/landing" className="transition-transform hover:scale-[1.02]">
          <Logo markClassName="h-11 w-11" textClassName="text-2xl" />
        </Link>
        <div className="hidden items-center gap-1 lg:flex">
          {links.map(l => (
            <a
              key={l.label}
              href={l.href}
              className={cn(
                'relative rounded-lg px-4 py-2 text-[0.95rem] font-medium text-navy/80 transition-colors hover:text-primary',
                'after:absolute after:inset-x-4 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-300 hover:after:scale-x-100',
                active === l.label && 'text-primary after:scale-x-100',
              )}
            >
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full text-navy" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>
          <Button variant="outline" className="hidden h-11 px-6 sm:inline-flex" onClick={() => navigate('/login')}>Login</Button>
          <Button className="hidden h-11 px-6 sm:inline-flex" onClick={() => navigate('/signup')}>Get Started</Button>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(o => !o)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {open && (
        <div className="animate-fade-in-up border-t bg-background/95 px-4 pb-4 pt-2 backdrop-blur-xl lg:hidden">
          {links.map(l => (
            <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 font-medium text-navy hover:bg-accent">
              {l.label}
            </a>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2 sm:hidden">
            <Button variant="outline" onClick={() => navigate('/login')}>Login</Button>
            <Button onClick={() => navigate('/signup')}>Get Started</Button>
          </div>
        </div>
      )}
    </nav>
  );
}
