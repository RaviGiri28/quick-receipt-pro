import { cn } from '@/lib/utils';
import { tagMeta } from '@/lib/blog';

export function TagBadge({ tag, className }: { tag: string; className?: string }) {
  const meta = tagMeta(tag);
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', meta.className, className)}>
      {meta.label}
    </span>
  );
}
