import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState, EmptyState } from '@/components/common/states';
import { useSlotsSummary } from '@/api/hooks';
import { formatUsdt } from '@/lib/utils';

export default function SlotsOverviewPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useSlotsSummary();

  return (
    <div className="space-y-4">
      <PageHeader title="Slot Summary" description="Every slot in the catalog with how many users own it." />

      {isLoading ? (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {Array.from({ length: 15 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No slots found" />
      ) : (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {data.map((slot) => (
            <Card
              key={slot.slotNumber}
              onClick={() => navigate(`/slots/${slot.slotNumber}/users`)}
              className="flex cursor-pointer flex-col items-center gap-1.5 p-3 text-center transition-colors hover:border-primary/50 hover:bg-muted/30"
            >
              <span className="text-xs font-medium text-muted-foreground">Slot {slot.slotNumber}</span>
              <span className="text-sm font-semibold tabular-nums">{formatUsdt(slot.amount)} USDT</span>
              <Badge variant={slot.isActive ? 'success' : 'muted'} className="text-[10px]">
                {slot.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span className="font-medium text-foreground tabular-nums">{slot.userCount}</span>
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
