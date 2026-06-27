import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { AddressDisplay } from '@/components/common/AddressDisplay';
import { Badge } from '@/components/ui/badge';
import { useReferrals } from '@/api/hooks';
import type { Referral } from '@/api/types';
import { formatDateShort } from '@/lib/utils';

const LIMIT = 20;

export default function ReferralsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useReferrals(page, LIMIT);

  const columns: Column<Referral>[] = [
    {
      key: 'referrer',
      header: 'Referrer',
      cell: (r) =>
        r.referrer ? (
          <div className="leading-tight">
            <p className="text-sm font-medium">{r.referrer.username}</p>
            <AddressDisplay address={r.referrer.walletAddress} withCopy={false} />
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'arrow',
      header: '',
      headClassName: 'w-8',
      cell: () => <ArrowRight className="h-4 w-4 text-muted-foreground" />,
    },
    {
      key: 'referred',
      header: 'Referred user',
      cell: (r) =>
        r.referredUser ? (
          <div className="leading-tight">
            <p className="text-sm font-medium">{r.referredUser.username}</p>
            <AddressDisplay address={r.referredUser.walletAddress} withCopy={false} />
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'level',
      header: 'Level',
      cell: (r) => <Badge variant="secondary">L{r.level}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => (
        <Badge variant={r.status === 'active' ? 'success' : 'muted'}>{r.status}</Badge>
      ),
    },
    {
      key: 'joined',
      header: 'Referred user joined',
      cell: (r) => (
        <span className="text-muted-foreground">{formatDateShort(r.referredUser?.createdAt ?? r.createdAt)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Referrals" description="Genealogy of every referral relationship." />

      <DataTable
        columns={columns}
        data={data?.items}
        rowKey={(r) => r._id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyTitle="No referrals yet"
      />

      <Pagination pagination={data?.pagination} page={page} onPageChange={setPage} />
    </div>
  );
}
