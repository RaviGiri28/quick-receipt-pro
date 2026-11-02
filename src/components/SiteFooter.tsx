import { Link } from 'react-router-dom';
import { Logo } from '@/components/brand/Logo';
import { LEGAL_COUNTRY, LEGAL_OPERATOR } from '@/lib/legal';

// Footer of the public site (landing, blog, legal pages).
export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
        <Logo markClassName="h-8 w-8" textClassName="text-lg" />
        <nav aria-label="Legal" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link to="/privacy" className="hover:text-primary hover:underline">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-primary hover:underline">Terms &amp; Conditions</Link>
          <Link to="/refund-policy" className="hover:text-primary hover:underline">Refund &amp; Cancellation</Link>
          <Link to="/blog" className="hover:text-primary hover:underline">Blog</Link>
        </nav>
        <p className="text-center sm:text-right">© {new Date().getFullYear()} Quick Receipt. Operated by {LEGAL_OPERATOR}, {LEGAL_COUNTRY}.</p>
      </div>
    </footer>
  );
}

// Compact links for auth pages and the app sidebar.
export function LegalLinks({ className = '' }: { className?: string }) {
  return (
    <p className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs ${className}`}>
      <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
      <span aria-hidden>·</span>
      <Link to="/terms" className="hover:underline">Terms &amp; Conditions</Link>
      <span aria-hidden>·</span>
      <Link to="/refund-policy" className="hover:underline">Refund Policy</Link>
    </p>
  );
}
