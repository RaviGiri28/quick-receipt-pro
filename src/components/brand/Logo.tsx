import logoMark from '@/assets/logo-mark.png';
import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src={logoMark}
      alt=""
      aria-hidden
      draggable={false}
      className={cn('h-10 w-10 shrink-0 select-none drop-shadow-[0_6px_14px_rgba(26,86,219,0.35)]', className)}
    />
  );
}

interface LogoProps {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  /** Light wordmark for use on the blue sidebar. */
  variant?: 'default' | 'light';
}

export function Logo({ className, markClassName, textClassName, variant = 'default' }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)} aria-label="Quick Receipt Pro">
      <LogoMark className={markClassName} />
      <span className={cn('text-xl font-extrabold tracking-tight', textClassName)}>
        <span className={variant === 'light' ? 'text-white' : 'text-navy'}>Quick</span>
        <span className={variant === 'light' ? 'text-sky-200' : 'text-primary'}>Receipt</span>
        <span className={cn('ml-1.5', variant === 'light' ? 'text-white' : 'text-navy')}>Pro</span>
      </span>
    </span>
  );
}
