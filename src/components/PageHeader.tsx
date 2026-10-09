import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Small breadcrumb-style label above the title. */
  eyebrow?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, icon: Icon, eyebrow, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-4 no-print', className)}>
      <div className="flex items-center gap-4 min-w-0">
        {Icon && (
          <div className="icon-tile h-14 w-14 rounded-2xl shadow-[0_8px_20px_-12px_hsl(var(--primary)/0.6)]">
            <Icon className="h-7 w-7" />
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && <p className="text-sm font-medium text-muted-foreground/80">{eyebrow}</p>}
          <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground sm:text-base">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
