import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BinaryTree } from '@/components/tree/BinaryTree';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';
import { useSlotBreakdown, useSlotCatalog, useSlotTree } from '@/api/hooks';
import { ALL_SLOTS, SLOT_AMOUNTS } from '@/lib/constants';
import { formatUsdt } from '@/lib/utils';
import type { SlotTreeNode } from '@/api/types';

const DEPTHS = [1, 2, 3, 4, 5, 6];

export default function SlotTreePage() {
  const navigate = useNavigate();
  const [slot, setSlot] = useState(1);
  const [depth, setDepth] = useState(4);

  const { data: catalog } = useSlotCatalog();
  const { data: tree, isLoading, isError, refetch } = useSlotTree(slot, depth);
  const { data: breakdown } = useSlotBreakdown();

  const slots = useMemo(() => {
    if (catalog && catalog.length) return catalog.map((s) => s.slotNumber).sort((a, b) => a - b);
    return ALL_SLOTS;
  }, [catalog]);

  const amount = useMemo(() => {
    const fromCatalog = catalog?.find((s) => s.slotNumber === slot)?.amount;
    return fromCatalog ?? SLOT_AMOUNTS[slot];
  }, [catalog, slot]);

  const breakdownData = useMemo(() => {
    const arr = breakdown?.[`slot${slot}`] ?? [];
    return [...arr].sort((a, b) => a.level - b.level).map((e) => ({ level: `L${e.level}`, count: e.count }));
  }, [breakdown, slot]);

  const handleNodeClick = (node: SlotTreeNode) => {
    navigate(`/users?search=${node.userWallet}`);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Slot Trees"
        description="Interactive binary tree visualization. Click a node to find that member."
        actions={
          <div className="flex items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Slot</Label>
              <Select value={String(slot)} onValueChange={(v) => setSlot(Number(v))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {slots.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      Slot {s} · {formatUsdt(SLOT_AMOUNTS[s])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Depth</Label>
              <Select value={String(depth)} onValueChange={(v) => setDepth(Number(v))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPTHS.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        }
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">
            Slot {slot} tree <span className="text-sm font-normal text-muted-foreground">· {formatUsdt(amount)} USDT</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState label="Loading tree…" />
          ) : isError ? (
            <ErrorState message="Could not load this slot tree." onRetry={() => refetch()} />
          ) : !tree ? (
            <EmptyState title="No tree positions" description={`Slot ${slot} has no members yet.`} />
          ) : (
            <BinaryTree root={tree} slot={slot} onNodeClick={handleNodeClick} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Node count per level — Slot {slot}</CardTitle>
        </CardHeader>
        <CardContent>
          {breakdownData.length === 0 ? (
            <EmptyState title="No level data" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={breakdownData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="level" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                <RTooltip
                  cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
