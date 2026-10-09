import type { LucideIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormSectionProps {
  icon: LucideIcon;
  title: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

// White card with an icon-tile header, used for each block of a form.
export function FormSection({ icon: Icon, title, description, actions, className, children }: FormSectionProps) {
  return (
    <section className={cn('card-soft p-5 sm:p-6', className)}>
      <div className="mb-5 flex items-center gap-3">
        <div className="icon-tile h-11 w-11"><Icon className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-navy">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function Field({ label, htmlFor, error, children, className }: {
  label: React.ReactNode;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor} className="font-semibold text-navy">{label}</Label>
      {children}
      {error && <p className="animate-fade-in-up text-xs text-destructive">{error}</p>}
    </div>
  );
}
