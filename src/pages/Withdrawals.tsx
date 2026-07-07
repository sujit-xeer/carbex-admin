import { useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { AddressDisplay } from '@/components/common/AddressDisplay';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWithdrawals } from '@/api/hooks';
import type { Withdrawal, WithdrawalStatus } from '@/api/types';
import { useDebounce } from '@/lib/useDebounce';
import { bscScanTx, maskHash } from '@/lib/wallet';
import { formatDate, formatUsdt } from '@/lib/utils';

const LIMIT = 20;
const ALL = '__all__';

const STATUS_VARIANT: Record<WithdrawalStatus, 'warning' | 'success' | 'muted'> = {
  pending: 'warning',
  completed: 'success',
  expired: 'muted',
};

export default function WithdrawalsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>(ALL);
  const [walletInput, setWalletInput] = useState('');
  const walletAddress = useDebounce(walletInput, 400);

  const { data, isLoading, isError, refetch } = useWithdrawals({
    page,
    limit: LIMIT,
    status: status === ALL ? undefined : status,
    walletAddress: walletAddress || undefined,
  });

  const resetToFirstPage = () => setPage(1);

  const columns: Column<Withdrawal>[] = [
    {
      key: 'user',
      header: 'User',
      cell: (w) =>
        w.user ? (
          <div className="leading-tight">
            <p className="text-sm font-medium">{w.user.username}</p>
            <AddressDisplay address={w.user.walletAddress ?? w.walletAddress} withCopy={false} />
          </div>
        ) : (
          <AddressDisplay address={w.walletAddress} withCopy={false} />
        ),
    },
    {
      key: 'amount',
      header: 'Amount',
      className: 'tabular-nums',
      cell: (w) => <span className="font-medium">{formatUsdt(w.amount)} USDT</span>,
    },
    {
      key: 'tokenAmount',
      header: 'Token Amount',
      className: 'tabular-nums',
      cell: (w) => formatUsdt(w.tokenAmount),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (w) => (
        <Badge variant={STATUS_VARIANT[w.status as WithdrawalStatus] ?? 'muted'}>{w.status}</Badge>
      ),
    },
    {
      key: 'tx',
      header: 'Tx Hash',
      cell: (w) =>
        w.txHash ? (
          <a
            href={bscScanTx(w.txHash)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
          >
            {maskHash(w.txHash)}
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'created',
      header: 'Created At',
      cell: (w) => <span className="text-muted-foreground">{formatDate(w.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Withdrawal History" description="Signed withdrawal requests and their on-chain settlement status." />

      <Card className="p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search by wallet address…"
              value={walletInput}
              onChange={(e) => {
                setWalletInput(e.target.value);
                resetToFirstPage();
              }}
            />
          </div>
          <div className="space-y-1">
            <Label className="sr-only">Status</Label>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                resetToFirstPage();
              }}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <DataTable
        columns={columns}
        data={data?.items}
        rowKey={(w) => w._id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyTitle="No withdrawals found"
      />

      <Pagination pagination={data?.pagination} page={page} onPageChange={setPage} />
    </div>
  );
}
