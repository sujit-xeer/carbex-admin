import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, RefreshCw, Radio, Database, Cog, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { AddressDisplay } from '@/components/common/AddressDisplay';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useContractEvents, useProcessStake } from '@/api/hooks';
import type { ProcessedStakeEvent } from '@/api/types';
import { formatTokenAmount, readChainEvents } from '@/lib/onchain';
import { CONTRACT_ADDRESS } from '@/lib/constants';
import { bscScanAddress, bscScanTx, maskHash, slotIndexToNumber } from '@/lib/wallet';
import { cn } from '@/lib/utils';

const LIMIT = 20;
const ALL = '__all__';

/** Normalized row shared by the backend + on-chain sources. */
interface EventRow {
  id: string;
  eventName: string;
  txHash: string;
  blockNumber: number;
  args: Record<string, unknown>;
  status?: string;
}

export default function OnChainPage() {
  const [source, setSource] = useState<'backend' | 'chain'>('backend');

  return (
    <div className="space-y-4">
      <PageHeader
        title="On-chain Events"
        description="CarbexStaking events on BSC testnet — Staked & Withdrawal."
        actions={
          <Select value={source} onValueChange={(v) => setSource(v as 'backend' | 'chain')}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="backend">Backend (indexed)</SelectItem>
              <SelectItem value="chain">Read from chain (fallback)</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Contract</CardTitle>
          <Badge variant="muted">BSC Testnet</Badge>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 text-sm">
          <AddressDisplay address={CONTRACT_ADDRESS} mono />
          <a
            href={bscScanAddress(CONTRACT_ADDRESS)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            View on BscScan <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </CardContent>
      </Card>

      <ProcessStakePanel />

      {source === 'backend' ? <BackendEvents onFallback={() => setSource('chain')} /> : <ChainEvents />}
    </div>
  );
}

const TXHASH_RE = /^0x[a-fA-F0-9]{64}$/;

function ProcessStakePanel() {
  const [txHash, setTxHash] = useState('');
  const process = useProcessStake();

  const trimmed = txHash.trim();
  const isValid = TXHASH_RE.test(trimmed);
  const showError = trimmed.length > 0 && !isValid;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    process.mutate(trimmed);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Cog className="h-4 w-4 text-primary" /> Process a stake
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Paste an on-chain <code className="rounded bg-muted px-1 py-0.5 text-xs">stake()</code> transaction hash to
          decode its <span className="font-medium text-foreground">Staked</span> events and place the slot(s). Idempotent
          — re-processing the same tx is a no-op.
        </p>
        <form className="flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={submit}>
          <div className="flex-1 space-y-1">
            <Label htmlFor="txhash" className="text-xs text-muted-foreground">
              Transaction hash
            </Label>
            <Input
              id="txhash"
              placeholder="0x… (32-byte hex)"
              className="font-mono text-xs"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              aria-invalid={showError}
            />
          </div>
          <Button type="submit" loading={process.isPending} disabled={!isValid}>
            <Cog className="h-4 w-4" /> Process
          </Button>
        </form>
        {showError && <p className="text-xs text-destructive">Must be a 32-byte hex hash (0x + 64 hex chars).</p>}

        {process.data && (
          <div className="space-y-2 rounded-md border bg-muted/20 p-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                tx
                <a
                  href={bscScanTx(process.data.txHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-primary hover:underline"
                >
                  {maskHash(process.data.txHash)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </span>
              <span className="tabular-nums">block {process.data.blockNumber.toLocaleString()}</span>
              <span>
                {process.data.events.length} event{process.data.events.length === 1 ? '' : 's'}
              </span>
            </div>
            <ul className="space-y-1.5">
              {process.data.events.map((ev) => (
                <ProcessedEventRow key={ev.id} ev={ev} />
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProcessedEventRow({ ev }: { ev: ProcessedStakeEvent }) {
  const icon =
    ev.status === 'processed' ? (
      <CheckCircle2 className="h-4 w-4 text-success" />
    ) : ev.status === 'skipped' ? (
      <MinusCircle className="h-4 w-4 text-muted-foreground" />
    ) : (
      <XCircle className="h-4 w-4 text-destructive" />
    );

  return (
    <li className="flex items-start gap-2 rounded-md bg-background/60 p-2 text-xs">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{ev.eventName}</span>
          <Badge
            variant={ev.status === 'processed' ? 'success' : ev.status === 'failed' ? 'destructive' : 'muted'}
          >
            {ev.status}
          </Badge>
        </div>
        {ev.note && <p className="mt-0.5 text-muted-foreground">{ev.note}</p>}
        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{ev.id}</p>
      </div>
    </li>
  );
}

const eventColumns: Column<EventRow>[] = [
  {
    key: 'event',
    header: 'Event',
    cell: (e) => (
      <Badge variant={e.eventName === 'Staked' ? 'success' : 'warning'}>{e.eventName}</Badge>
    ),
  },
  {
    key: 'details',
    header: 'Details',
    cell: (e) => <EventDetails row={e} />,
  },
  {
    key: 'block',
    header: 'Block',
    className: 'tabular-nums text-xs',
    cell: (e) => e.blockNumber.toLocaleString(),
  },
  {
    key: 'status',
    header: 'Status',
    cell: (e) =>
      e.status ? (
        <Badge variant={e.status === 'processed' ? 'success' : e.status === 'failed' ? 'destructive' : 'muted'}>
          {e.status}
        </Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    key: 'tx',
    header: 'Tx',
    cell: (e) => (
      <a
        href={bscScanTx(e.txHash)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
      >
        {maskHash(e.txHash)}
        <ExternalLink className="h-3 w-3" />
      </a>
    ),
  },
];

function EventDetails({ row }: { row: EventRow }) {
  const a = row.args;
  const str = (k: string) => (a[k] !== undefined && a[k] !== null ? String(a[k]) : undefined);

  if (row.eventName === 'Staked') {
    const slotIndex = str('slotIndex');
    return (
      <div className="space-y-0.5 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">user</span>
          <AddressDisplay address={str('user')} withCopy={false} />
        </div>
        <div className="flex flex-wrap gap-x-3 text-muted-foreground">
          <span>amount {formatTokenAmount(str('amount'))}</span>
          <span>usdt {formatTokenAmount(str('usdtValue'))}</span>
          {slotIndex !== undefined && (
            <span className="text-foreground">slot {slotIndexToNumber(Number(slotIndex))}</span>
          )}
        </div>
        {str('id') && <p className="font-mono text-[10px] text-muted-foreground">id {maskHash(str('id'))}</p>}
      </div>
    );
  }

  if (row.eventName === 'Withdrawal') {
    return (
      <div className="space-y-0.5 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">user</span>
          <AddressDisplay address={str('user')} withCopy={false} />
        </div>
        <div className="flex flex-wrap gap-x-3 text-muted-foreground">
          <span>amount {formatTokenAmount(str('amount'))}</span>
          <span>token {formatTokenAmount(str('tokenAmount'))}</span>
          <span>actual {formatTokenAmount(str('actualAmount'))}</span>
          <span>{str('percentage')}%</span>
        </div>
      </div>
    );
  }

  return <span className="font-mono text-xs text-muted-foreground">{JSON.stringify(a)}</span>;
}

function BackendEvents({ onFallback }: { onFallback: () => void }) {
  const [page, setPage] = useState(1);
  const [eventName, setEventName] = useState(ALL);
  const { data, isLoading, isError, refetch } = useContractEvents({
    page,
    limit: LIMIT,
    eventName: eventName === ALL ? undefined : eventName,
  });

  const rows: EventRow[] = useMemo(
    () =>
      (data?.items ?? []).map((e) => ({
        id: e._id,
        eventName: e.eventName,
        txHash: e.txHash,
        blockNumber: e.blockNumber,
        args: e.args,
        status: e.status,
      })),
    [data]
  );

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="h-4 w-4" /> Indexed events
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select
            value={eventName}
            onValueChange={(v) => {
              setEventName(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All events</SelectItem>
              <SelectItem value="Staked">Staked</SelectItem>
              <SelectItem value="Withdrawal">Withdrawal</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()} aria-label="Refresh">
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isError && (
          <div className="flex items-center justify-between rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
            <span className="text-warning">Backend events endpoint unavailable.</span>
            <Button size="sm" variant="outline" onClick={onFallback}>
              <Radio className="h-4 w-4" /> Read from chain instead
            </Button>
          </div>
        )}
        <DataTable
          columns={eventColumns}
          data={rows}
          rowKey={(e) => e.id}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          emptyTitle="No on-chain events indexed yet"
        />
        <Pagination pagination={data?.pagination} page={page} onPageChange={setPage} />
      </CardContent>
    </Card>
  );
}

function ChainEvents() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['chain-events'],
    queryFn: () => readChainEvents(),
    retry: false,
    staleTime: 0,
  });

  const rows: EventRow[] = useMemo(
    () =>
      (data ?? []).map((e) => ({
        id: e.id,
        eventName: e.eventName,
        txHash: e.txHash,
        blockNumber: e.blockNumber,
        args: e.args,
      })),
    [data]
  );

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Radio className="h-4 w-4 text-primary" /> Live from chain
          <span className="text-xs font-normal text-muted-foreground">(recent blocks, read-only)</span>
        </CardTitle>
        <Button variant="outline" size="icon" onClick={() => refetch()} aria-label="Refresh">
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
        </Button>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={eventColumns.filter((c) => c.key !== 'status')}
          data={rows}
          rowKey={(e) => e.id}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          emptyTitle="No recent events found on-chain"
          emptyDescription="No Staked or Withdrawal events in the scanned block window."
        />
      </CardContent>
    </Card>
  );
}
