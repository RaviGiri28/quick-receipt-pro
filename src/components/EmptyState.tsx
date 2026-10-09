import type { LucideIcon } from 'lucide-react';

export function Spinner() {
  return (
    <div className="flex justify-center py-14">
      <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-14 text-center animate-fade-in-up">
      <div className="relative mb-4">
        <div className="absolute inset-0 rounded-full bg-primary/15 blur-xl" />
        <div className="icon-tile relative h-16 w-16 rounded-2xl animate-float">
          <Icon className="h-8 w-8" />
        </div>
      </div>
      <p className="text-lg font-bold text-navy">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
