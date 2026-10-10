import { Eye, Info, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LivePreviewPanelProps {
  title?: string;
  subtitle?: string;
  className?: string;
  /** Replaces the default thermal-printer note under the receipt. */
  footer?: React.ReactNode;
  /** The receipt(s), usually wrapped in a `.print-area`. */
  children: React.ReactNode;
}

// Sticky card that frames on-screen receipts. Every wrapper is `print-static` so
// printing lays out the receipt exactly as it did without this frame.
export function LivePreviewPanel({ title = 'Live Preview', subtitle, className, footer, children }: LivePreviewPanelProps) {
  return (
    <div className={cn('print-static card-soft overflow-hidden p-4 sm:p-5 lg:sticky lg:top-24', className)}>
      <div className="mb-4 flex items-center gap-3 no-print">
        <div className="icon-tile h-11 w-11"><Eye className="h-5 w-5" /></div>
        <div>
          <h2 className="text-lg font-bold text-navy">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <span className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live
        </span>
      </div>
      <div className="print-static relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent via-accent/50 to-transparent p-4 sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 animate-blob bg-primary/10 no-print" />
        <div className="pointer-events-none absolute -bottom-12 -left-10 h-40 w-40 animate-blob bg-primary/10 [animation-delay:-7s] no-print" />
        <div className="print-static relative drop-shadow-[0_18px_28px_rgba(26,60,140,0.18)] transition-all duration-300">
          {children}
        </div>
      </div>
      {footer ? (
        <div className="mt-4 no-print">{footer}</div>
      ) : (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-full border border-primary/15 bg-accent/60 px-4 py-2.5 text-xs font-semibold text-primary no-print">
          <Printer className="h-4 w-4" /> Print on 58mm / 80mm Thermal Printer
          <Info className="h-3.5 w-3.5 opacity-70" />
        </div>
      )}
    </div>
  );
}
