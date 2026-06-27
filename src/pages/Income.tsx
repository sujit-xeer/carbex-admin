import { useState } from 'react';
import { Info, Play, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { AddressDisplay } from '@/components/common/AddressDisplay';
import {
  useClubBonus,
  useDirectPerformance,
  useRunClubBonus,
  useRunDirectPerformance,
} from '@/api/hooks';
import type { ClubBonusRecord, DirectPerformanceRecord, Pagination as PaginationMeta } from '@/api/types';
import { INCOME_MODEL } from '@/lib/constants';
import { formatDate, formatUsdt } from '@/lib/utils';

const LIMIT = 20;

/** Adapt the {records,total,page,pages} shape into the shared Pagination meta. */
function adaptPagination(page: number, pages?: number, total?: number): PaginationMeta {
  const totalPages = pages ?? 1;
  return {
    total: total ?? 0,
    page,
    limit: LIMIT,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export default function IncomePage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Income & Bonus" description="Distribution runs and historical bonus records." />
      <InfoPanel />
      <Tabs defaultValue="club">
        <TabsList>
          <TabsTrigger value="club">Club Bonus (weekly)</TabsTrigger>
          <TabsTrigger value="direct">Direct Performance (monthly)</TabsTrigger>
        </TabsList>
        <TabsContent value="club">
          <ClubBonusTab />
        </TabsContent>
        <TabsContent value="direct">
          <DirectPerformanceTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoPanel() {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <Info className="h-4 w-4 text-primary" />
        <CardTitle className="text-base">Income model</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
        <p>{INCOME_MODEL.referral}</p>
        <p>{INCOME_MODEL.level}</p>
        <p>{INCOME_MODEL.clubBonus}</p>
        <p>{INCOME_MODEL.directPerformance}</p>
        <p className="sm:col-span-2">{INCOME_MODEL.rebirth}</p>
      </CardContent>
    </Card>
  );
}

function ClubBonusTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useClubBonus(page, LIMIT);
  const run = useRunClubBonus();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const columns: Column<ClubBonusRecord>[] = [
    {
      key: 'user',
      header: 'User',
      cell: (r) =>
        r.user ? (
          <div className="leading-tight">
            <p className="text-sm font-medium">{r.user.username}</p>
            <AddressDisplay address={r.user.walletAddress} withCopy={false} />
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'amount',
      header: 'Amount',
      className: 'tabular-nums',
      cell: (r) => <span className="font-medium">{formatUsdt(r.amount)} USDT</span>,
    },
    {
      key: 'period',
      header: 'Period',
      cell: (r) => (
        <span className="text-xs text-muted-foreground">
          {r.periodStart ? formatDate(r.periodStart) : '—'}
        </span>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      cell: (r) => <span className="text-muted-foreground">{formatDate(r.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" /> Idempotent per week — running twice in one week is a no-op.
        </p>
        <Button onClick={() => setConfirmOpen(true)} loading={run.isPending}>
          <Play className="h-4 w-4" /> Run club bonus
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.records}
        rowKey={(r) => r._id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyTitle="No club bonus records yet"
      />
      <Pagination pagination={adaptPagination(page, data?.pages, data?.total)} page={page} onPageChange={setPage} />

      <ConfirmRunDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Run weekly club bonus distribution?"
        description="This distributes the club bonus for the current week. It is idempotent — if it already ran this week, nothing happens."
        loading={run.isPending}
        onConfirm={() => run.mutate(undefined, { onSuccess: () => setConfirmOpen(false) })}
      />
    </div>
  );
}

function DirectPerformanceTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useDirectPerformance(page, LIMIT);
  const run = useRunDirectPerformance();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const columns: Column<DirectPerformanceRecord>[] = [
    {
      key: 'user',
      header: 'User',
      cell: (r) =>
        r.user ? (
          <div className="leading-tight">
            <p className="text-sm font-medium">{r.user.username}</p>
            <AddressDisplay address={r.user.walletAddress} withCopy={false} />
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'amount',
      header: 'Amount',
      className: 'tabular-nums',
      cell: (r) => <span className="font-medium">{formatUsdt(r.amount)} USDT</span>,
    },
    {
      key: 'period',
      header: 'Period',
      cell: (r) => (
        <span className="text-xs text-muted-foreground">{r.periodStart ? formatDate(r.periodStart) : '—'}</span>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      cell: (r) => <span className="text-muted-foreground">{formatDate(r.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" /> Idempotent per month — running twice in one month is a no-op.
        </p>
        <Button onClick={() => setConfirmOpen(true)} loading={run.isPending}>
          <Play className="h-4 w-4" /> Run direct performance
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.records}
        rowKey={(r) => r._id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyTitle="No direct performance records yet"
      />
      <Pagination pagination={adaptPagination(page, data?.pages, data?.total)} page={page} onPageChange={setPage} />

      <ConfirmRunDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Run monthly direct performance distribution?"
        description="This distributes the direct performance bonus for the current month. It is idempotent — if it already ran this month, nothing happens."
        loading={run.isPending}
        onConfirm={() => run.mutate(undefined, { onSuccess: () => setConfirmOpen(false) })}
      />
    </div>
  );
}

function ConfirmRunDialog({
  open,
  onOpenChange,
  title,
  description,
  loading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description: string;
  loading: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button loading={loading} onClick={onConfirm}>
            <Play className="h-4 w-4" /> Run now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
