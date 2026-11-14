import { Link } from 'react-router-dom';
import { Logo } from '@/components/brand/Logo';
import { LEGAL_COUNTRY, LEGAL_ENTITY, LEGAL_OPERATOR } from '@/lib/legal';

// Footer of the public site (landing, blog, legal pages).
export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-muted-foreground">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <Logo markClassName="h-8 w-8" textClassName="text-lg" />
        <nav aria-label="Legal" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link to="/privacy" className="hover:text-primary hover:underline">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-primary hover:underline">Terms &amp; Conditions</Link>
          <Link to="/refund-policy" className="hover:text-primary hover:underline">Refund &amp; Cancellation</Link>
          <Link to="/about" className="hover:text-primary hover:underline">About</Link>
          <Link to="/blog" className="hover:text-primary hover:underline">Blog</Link>
        </nav>
        </div>
        <p className="border-t border-border/60 pt-4 text-center text-xs sm:text-sm">© {new Date().getFullYear()} ({LEGAL_ENTITY}). All rights reserved. · Udyam Registered MSME · {LEGAL_COUNTRY}</p>
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
