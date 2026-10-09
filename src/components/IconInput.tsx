import { forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface IconInputProps extends React.ComponentProps<typeof Input> {
  icon: LucideIcon;
  /** Element pinned to the right edge, e.g. a show-password toggle. */
  trailing?: React.ReactNode;
}

// Input with a leading icon that turns blue while the field has focus.
export const IconInput = forwardRef<HTMLInputElement, IconInputProps>(
  ({ icon: Icon, trailing, className, ...props }, ref) => (
    <div className="relative">
      <Input ref={ref} className={cn('peer pl-10', trailing && 'pr-11', className)} {...props} />
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors duration-200 peer-focus:text-primary" />
      {trailing && <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</div>}
    </div>
  ),
);
IconInput.displayName = 'IconInput';
