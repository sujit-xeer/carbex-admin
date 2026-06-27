import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { AddressDisplay } from '@/components/common/AddressDisplay';
import { useLoginActivity } from '@/api/hooks';
import type { LoginActivity } from '@/api/types';
import { formatDate, truncate } from '@/lib/utils';

const LIMIT = 25;

export default function ActivityPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useLoginActivity({ page, limit: LIMIT });

  const columns: Column<LoginActivity>[] = [
    {
      key: 'user',
      header: 'User',
      cell: (a) =>
        a.user ? (
          <div className="leading-tight">
            <p className="text-sm font-medium">{a.user.username}</p>
            <AddressDisplay address={a.user.walletAddress ?? a.walletAddress} withCopy={false} />
          </div>
        ) : (
          <AddressDisplay address={a.walletAddress} withCopy={false} />
        ),
    },
    {
      key: 'ip',
      header: 'IP address',
      className: 'font-mono text-xs',
      cell: (a) => a.ipAddress || '—',
    },
    {
      key: 'ua',
      header: 'User agent',
      className: 'max-w-xs',
      cell: (a) => (
        <span className="text-xs text-muted-foreground" title={a.userAgent}>
          {truncate(a.userAgent, 48)}
        </span>
      ),
    },
    {
      key: 'time',
      header: 'Login time',
      cell: (a) => <span className="text-muted-foreground">{formatDate(a.loginTime)}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Login Activity" description="Authentication history across all accounts." />
      <DataTable
        columns={columns}
        data={data?.items}
        rowKey={(a) => a._id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyTitle="No login activity yet"
      />
      <Pagination pagination={data?.pagination} page={page} onPageChange={setPage} />
    </div>
  );
}
