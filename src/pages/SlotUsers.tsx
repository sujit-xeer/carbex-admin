import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { AddressDisplay } from '@/components/common/AddressDisplay';
import { UserStatusBadge } from '@/components/common/StatusBadge';
import { useSlotUsers } from '@/api/hooks';
import type { SlotUser } from '@/api/types';
import { SLOT_AMOUNTS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';

const LIMIT = 20;

export default function SlotUsersPage() {
  const { slot: slotParam = '' } = useParams();
  const navigate = useNavigate();
  const slot = Number(slotParam);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useSlotUsers(slot, { page, limit: LIMIT });

  const columns: Column<SlotUser>[] = [
    {
      key: 'username',
      header: 'Username',
      cell: (u) => <span className="font-medium">{u.username}</span>,
    },
    {
      key: 'wallet',
      header: 'Wallet',
      cell: (u) => <AddressDisplay address={u.walletAddress} />,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (u) => <UserStatusBadge isActive={u.isActive} isSuspended={u.isSuspended} />,
    },
    {
      key: 'position',
      header: 'Position',
      className: 'text-xs tabular-nums',
      cell: (u) => (
        <span className="text-muted-foreground">
          L{u.level} · #{u.bfsIndex}
        </span>
      ),
    },
    {
      key: 'purchasedAt',
      header: 'Purchased At',
      cell: (u) => <span className="text-muted-foreground">{formatDate(u.purchasedAt)}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => navigate('/slots/overview')}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to slot summary
      </button>

      <PageHeader
        title={`Slot ${slot} Users`}
        description={`Users who own slot ${slot}${SLOT_AMOUNTS[slot] ? ` · ${SLOT_AMOUNTS[slot]} USDT` : ''}.`}
      />

      <DataTable
        columns={columns}
        data={data?.items}
        rowKey={(u) => u._id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        onRowClick={(u) => navigate(`/users/${u._id}`)}
        emptyTitle="No users own this slot yet"
      />

      <Pagination pagination={data?.pagination} page={page} onPageChange={setPage} />
    </div>
  );
}
