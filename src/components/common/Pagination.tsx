import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Pagination as PaginationMeta } from '@/api/types';

interface PaginationProps {
  pagination?: PaginationMeta;
  page: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination, page, onPageChange }: PaginationProps) {
  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? 0;
  const hasPrev = pagination?.hasPrev ?? page > 1;
  const hasNext = pagination?.hasNext ?? page < totalPages;

  return (
    <div className="flex flex-col items-center justify-between gap-3 px-1 py-3 sm:flex-row">
      <p className="text-xs text-muted-foreground">
        {total > 0 ? (
          <>
            Page <span className="font-medium text-foreground">{page}</span> of{' '}
            <span className="font-medium text-foreground">{totalPages}</span> · {total.toLocaleString()} total
          </>
        ) : (
          'No results'
        )}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={!hasPrev} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
        <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => onPageChange(page + 1)}>
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
