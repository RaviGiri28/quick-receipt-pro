import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PagerProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  /** Plural noun after the total, e.g. "posts". */
  label?: string;
}

export function Pager({ page, totalPages, total, onPageChange, label = 'receipts' }: PagerProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4 text-sm text-muted-foreground">
      <span>{total} {label}</span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span>Page {page} of {totalPages}</span>
        <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
