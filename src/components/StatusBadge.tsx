import { cn } from '@/lib/utils';

export function StatusBadge({ status }: { status: 'success' | 'pending' }) {
  const success = status === 'success';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        success
          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', success ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse')} />
      {success ? 'Success' : 'Pending'}
    </span>
  );
}
