import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { AddressDisplay } from '@/components/common/AddressDisplay';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/common/CopyButton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useSlotPurchases } from '@/api/hooks';
import type { SlotPurchase } from '@/api/types';
import { ALL_SLOTS, SLOT_AMOUNTS } from '@/lib/constants';
import { bscScanTx, maskHash } from '@/lib/wallet';
import { formatDate } from '@/lib/utils';

const LIMIT = 20;
const ALL = '__all__';

export default function SlotPurchasesPage() {
  const [page, setPage] = useState(1);
  const [slot, setSlot] = useState<string>(ALL);

  const { data, isLoading, isError, refetch } = useSlotPurchases({
    page,
    limit: LIMIT,
    slot: slot === ALL ? undefined : Number(slot),
  });

  const columns: Column<SlotPurchase>[] = [
    {
      key: 'user',
      header: 'User',
      cell: (p) =>
        p.user ? (
          <div className="leading-tight">
            <p className="text-sm font-medium">{p.user.username}</p>
            <AddressDisplay address={p.user.walletAddress} withCopy={false} />
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'slot',
      header: 'Slot',
      cell: (p) => (
        <div className="leading-tight">
          <Badge variant="secondary">Slot {p.slot}</Badge>
          <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">{SLOT_AMOUNTS[p.slot] ?? '—'} USDT</p>
        </div>
      ),
    },
    {
      key: 'position',
      header: 'Position',
      className: 'text-xs tabular-nums',
      cell: (p) => (
        <span className="text-muted-foreground">
          L{p.level} · #{p.bfsIndex}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (p) =>
        p.isRebirth ? <Badge variant="warning">Rebirth</Badge> : <Badge variant="default">Paid</Badge>,
    },
    {
      key: 'completed',
      header: 'Completed',
      cell: (p) =>
        p.isCompleted ? (
          <Badge variant="success" title={formatDate(p.completedAt)}>
            Done
          </Badge>
        ) : (
          <Badge variant="muted">Active</Badge>
        ),
    },
    {
      key: 'stake',
      header: 'On-chain stake',
      cell: (p) =>
        p.stakeId ? (
          <span className="inline-flex items-center gap-1 font-mono text-xs">
            {maskHash(p.stakeId)}
            <CopyButton value={p.stakeId} label="Stake id copied" />
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'tx',
      header: 'Tx',
      cell: (p) =>
        p.txHash ? (
          <a
            href={bscScanTx(p.txHash)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
          >
            {maskHash(p.txHash)}
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'created',
      header: 'Created',
      cell: (p) => <span className="text-muted-foreground">{formatDate(p.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Slot Purchases" description="Every paid entry and rebirth re-entry, with on-chain provenance." />

      <Card className="p-3">
        <div className="flex items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Filter by slot</Label>
            <Select
              value={slot}
              onValueChange={(v) => {
                setSlot(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All slots</SelectItem>
                {ALL_SLOTS.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    Slot {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <DataTable
        columns={columns}
        data={data?.items}
        rowKey={(p) => p._id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyTitle="No purchases found"
      />

      <Pagination pagination={data?.pagination} page={page} onPageChange={setPage} />
    </div>
  );
}
