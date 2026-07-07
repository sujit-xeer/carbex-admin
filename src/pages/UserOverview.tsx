import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Coins, Network, Wallet } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddressDisplay } from "@/components/common/AddressDisplay";
import { CopyButton } from "@/components/common/CopyButton";
import { DataTable, type Column } from "@/components/common/DataTable";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/common/states";
import { BinaryTree } from "@/components/tree/BinaryTree";
import {
  useOverviewClubBonus,
  useOverviewDirectPerformance,
  useOverviewLevelIncome,
  useOverviewProfile,
  useOverviewRebirths,
  useOverviewReferrals,
  useOverviewSlots,
  useOverviewSlotTree,
} from "@/api/hooks";
import type {
  ClubBonusHistoryRecord,
  DirectPerformanceHistoryRecord,
  LevelIncomeRecord,
  OverviewProfile,
  OverviewRebirthRecord,
  OverviewReferralEntry,
  OverviewSlotPurchase,
  RebirthSlotGroup,
} from "@/api/types";
import { API_URL, ALL_SLOTS } from "@/lib/constants";
import { cn, formatDate, formatDateShort, formatUsdt } from "@/lib/utils";

const ALL_SLOTS_VALUE = "__all__";
const DEPTHS = [1, 2, 3, 4, 5];

export default function UserOverviewPage() {
  const { username = "" } = useParams();
  const { data, isLoading, isError, refetch } = useOverviewProfile(username);
  const [treeSlot, setTreeSlot] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <Link
        to="/users"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to users
      </Link>

      <PageHeader
        title="User Overview"
        description="Full public profile, income, slots and referral activity."
      />

      {isLoading ? (
        <LoadingState label="Loading overview…" />
      ) : isError || !data ? (
        <ErrorState message="User not found." onRetry={() => refetch()} />
      ) : (
        <>
          <ProfileHeader profile={data} />

          <Tabs defaultValue="slots">
            <TabsList className="h-auto flex-wrap">
              <TabsTrigger value="slots">Slots</TabsTrigger>
              <TabsTrigger value="referrals">Referrals</TabsTrigger>
              <TabsTrigger value="level">Level Income</TabsTrigger>
              <TabsTrigger value="club">Club Bonus</TabsTrigger>
              <TabsTrigger value="direct">Direct Performance</TabsTrigger>
              <TabsTrigger value="rebirths">Rebirths</TabsTrigger>
            </TabsList>
            <TabsContent value="slots">
              <SlotsTab username={username} onViewTree={setTreeSlot} />
            </TabsContent>
            <TabsContent value="referrals">
              <ReferralsTab username={username} />
            </TabsContent>
            <TabsContent value="level">
              <LevelIncomeTab username={username} />
            </TabsContent>
            <TabsContent value="club">
              <ClubBonusTab username={username} />
            </TabsContent>
            <TabsContent value="direct">
              <DirectPerformanceTab username={username} />
            </TabsContent>
            <TabsContent value="rebirths">
              <RebirthsTab username={username} />
            </TabsContent>
          </Tabs>

          <TreeDialog
            username={username}
            slot={treeSlot}
            onOpenChange={(o) => !o && setTreeSlot(null)}
          />
        </>
      )}
    </div>
  );
}

function ProfileHeader({ profile }: { profile: OverviewProfile }) {
  const { user, income, balance, clubEligibility } = profile;
  const profileSrc = user.profileImage
    ? user.profileImage.startsWith("http")
      ? user.profileImage
      : `${API_URL}/${user.profileImage.replace(/^\//, "")}`
    : undefined;

  return (
    <Card>
      <CardContent className="grid gap-6 pt-6 lg:grid-cols-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-14 w-14">
            {profileSrc && <AvatarImage src={profileSrc} alt={user.username} />}
            <AvatarFallback className="text-lg">
              {user.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="inline-flex items-center gap-1 font-semibold">
              {user.username}
              <CopyButton value={user.username} label="Username copied" />
            </p>
            <AddressDisplay address={user.walletAddress} withLink />
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant={user.isActive ? "success" : "muted"}>
                {user.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge variant={clubEligibility.slot6 ? "success" : "outline"}>
                Club 6 {clubEligibility.slot6 ? "✓" : "✗"}
              </Badge>
              <Badge variant={clubEligibility.slot12 ? "success" : "outline"}>
                Club 12 {clubEligibility.slot12 ? "✓" : "✗"}
              </Badge>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Coins className="h-3.5 w-3.5" /> Income breakdown
          </p>
          <div className="grid grid-cols-2 gap-2">
            <IncomeStat label="Referral" value={income.referral} />
            <IncomeStat label="Level" value={income.level} />
            <IncomeStat label="Club bonus" value={income.clubBonus} />
            <IncomeStat label="Direct perf." value={income.directPerformance} />
          </div>
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Wallet className="h-3.5 w-3.5" /> Balance
          </p>
          <div className="grid grid-cols-3 gap-2">
            <BalanceStat label="Earned" value={balance.earned} />
            <BalanceStat label="Withdrawn" value={balance.withdrawn} />
            <BalanceStat
              label="Available"
              value={balance.available}
              highlight
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function IncomeStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-2.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums">
        {formatUsdt(value)}
      </p>
    </div>
  );
}

function BalanceStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-2.5",
        highlight ? "border-primary/40 bg-primary/10" : "bg-muted/20",
      )}
    >
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-sm font-semibold tabular-nums",
          highlight && "text-primary",
        )}
      >
        {formatUsdt(value)}
      </p>
    </div>
  );
}

function SlotsTab({
  username,
  onViewTree,
}: {
  username: string;
  onViewTree: (slot: number) => void;
}) {
  const { data, isLoading, isError, refetch } = useOverviewSlots(username);

  const columns: Column<OverviewSlotPurchase>[] = [
    {
      key: "slot",
      header: "Slot",
      className: "tabular-nums",
      cell: (p) => p.slot,
    },
    {
      key: "entryId",
      header: "Entry ID",
      cell: (p) => (
        <span className="font-mono text-xs">{p.entryId ?? "—"}</span>
      ),
    },
    {
      key: "bfsIndex",
      header: "BFS Index",
      className: "tabular-nums",
      cell: (p) => p.bfsIndex,
    },
    {
      key: "level",
      header: "Level",
      className: "tabular-nums",
      cell: (p) => p.level,
    },
    {
      key: "status",
      header: "Status",
      cell: (p) => (
        <div className="flex flex-wrap gap-1">
          {p.isRebirth && <Badge variant="secondary">Rebirth</Badge>}
          <Badge variant={p.isCompleted ? "success" : "muted"}>
            {p.isCompleted ? "Completed" : "Active"}
          </Badge>
        </div>
      ),
    },
    {
      key: "created",
      header: "Purchased",
      cell: (p) => (
        <span className="text-muted-foreground">
          {formatDateShort(p.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (p) => (
        <Button variant="ghost" size="sm" onClick={() => onViewTree(p.slot)}>
          <Network className="h-4 w-4" /> View tree
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={data?.purchases}
        rowKey={(p) => p._id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyTitle="No slots purchased yet"
      />
      {data && data.rebirths.totalRebirths > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Rebirths summary{" "}
              <span className="font-normal text-muted-foreground">
                · {data.rebirths.totalRebirths} total
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.rebirths.slots.map((s) => (
              <Badge key={s.slot} variant="outline">
                Slot {s.slot}: {s.count} rebirth{s.count > 1 ? "s" : ""}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ReferralsTab({ username }: { username: string }) {
  const { data, isLoading, isError, refetch } = useOverviewReferrals(username);

  const byLevel = useMemo(() => {
    const grouped: Record<number, OverviewReferralEntry[]> = {
      1: [],
      2: [],
      3: [],
    };
    for (const entry of data?.tree ?? []) {
      if (!grouped[entry.level]) grouped[entry.level] = [];
      grouped[entry.level].push(entry);
    }
    return grouped;
  }, [data]);

  if (isLoading) return <LoadingState label="Loading referrals…" />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total" value={data.stats.total} />
        <StatTile label="Active" value={data.stats.active} />
        <StatTile label="Pending" value={data.stats.pending} />
        <StatTile label="Inactive" value={data.stats.inactive} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {[1, 2, 3].map((level) => (
          <Card key={level}>
            <CardHeader>
              <CardTitle className="text-sm">
                Level {level}{" "}
                <span className="font-normal text-muted-foreground">
                  · {byLevel[level]?.length ?? 0}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {byLevel[level]?.length ? (
                byLevel[level].map((entry, i) => (
                  <div key={i} className="rounded-md border p-2 text-sm">
                    <p className="font-medium">
                      {entry.referredUser?.username ?? "—"}
                    </p>
                    <AddressDisplay
                      address={entry.referredUser?.walletAddress}
                      withCopy={false}
                    />
                    <div className="mt-1 flex items-center justify-between">
                      {entry.status && (
                        <Badge variant="muted" className="text-[10px]">
                          {entry.status}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDateShort(entry.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No referrals at this level"
                  className="py-4"
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function TotalEarnedBanner({ total }: { total: number | undefined }) {
  if (total === undefined) return null;
  return (
    <p className="text-sm text-muted-foreground">
      Total earned:{" "}
      <span className="font-semibold text-foreground tabular-nums">
        {formatUsdt(total)} USDT
      </span>
    </p>
  );
}

function LevelIncomeTab({ username }: { username: string }) {
  const { data, isLoading, isError, refetch } =
    useOverviewLevelIncome(username);

  const columns: Column<LevelIncomeRecord>[] = [
    {
      key: "slot",
      header: "Slot",
      className: "tabular-nums",
      cell: (r) => r.slot,
    },
    {
      key: "slotAmount",
      header: "Slot Amount",
      className: "tabular-nums",
      cell: (r) => formatUsdt(r.slotAmount),
    },
    {
      key: "level",
      header: "Level",
      className: "tabular-nums",
      cell: (r) => `L${r.level}`,
    },
    {
      key: "per",
      header: "%",
      className: "tabular-nums",
      cell: (r) => `${r.per}%`,
    },
    {
      key: "amount",
      header: "Amount",
      className: "tabular-nums font-medium",
      cell: (r) => `${formatUsdt(r.amount)} USDT`,
    },
    {
      key: "from",
      header: "From",
      cell: (r) => (
        <AddressDisplay address={r.fromUserWallet} withCopy={false} />
      ),
    },
    {
      key: "created",
      header: "Date",
      cell: (r) => (
        <span className="text-muted-foreground">{formatDate(r.createdAt)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <TotalEarnedBanner total={data?.totalEarned} />
      <DataTable
        columns={columns}
        data={data?.records}
        rowKey={(r) => r._id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyTitle="No level income yet"
      />
    </div>
  );
}

function ClubBonusTab({ username }: { username: string }) {
  const { data, isLoading, isError, refetch } = useOverviewClubBonus(username);

  const columns: Column<ClubBonusHistoryRecord>[] = [
    {
      key: "club",
      header: "Club",
      className: "tabular-nums",
      cell: (r) => r.club,
    },
    { key: "name", header: "Income", cell: (r) => r.incomeName },
    {
      key: "period",
      header: "Period",
      cell: (r) => (
        <span className="text-xs text-muted-foreground">
          {formatDateShort(r.periodStart)} – {formatDateShort(r.periodEnd)}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      className: "tabular-nums font-medium",
      cell: (r) => `${formatUsdt(r.amount)} USDT`,
    },
  ];

  return (
    <div className="space-y-3">
      <TotalEarnedBanner total={data?.totalEarned} />
      <DataTable
        columns={columns}
        data={data?.records}
        rowKey={(r) => r._id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyTitle="No club bonus records yet"
      />
    </div>
  );
}

function DirectPerformanceTab({ username }: { username: string }) {
  const { data, isLoading, isError, refetch } =
    useOverviewDirectPerformance(username);

  const columns: Column<DirectPerformanceHistoryRecord>[] = [
    { key: "name", header: "Income", cell: (r) => r.incomeName },
    {
      key: "period",
      header: "Period",
      cell: (r) => (
        <span className="text-xs text-muted-foreground">
          {formatDateShort(r.periodStart)} – {formatDateShort(r.periodEnd)}
        </span>
      ),
    },
    {
      key: "directCount",
      header: "Direct Count",
      className: "tabular-nums",
      cell: (r) => r.directCount,
    },
    {
      key: "percentage",
      header: "%",
      className: "tabular-nums",
      cell: (r) => `${r.percentage}%`,
    },
    {
      key: "amount",
      header: "Amount",
      className: "tabular-nums font-medium",
      cell: (r) => `${formatUsdt(r.amount)} USDT`,
    },
  ];

  return (
    <div className="space-y-3">
      <TotalEarnedBanner total={data?.totalEarned} />
      <DataTable
        columns={columns}
        data={data?.records}
        rowKey={(r) => r._id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyTitle="No direct performance records yet"
      />
    </div>
  );
}

function RebirthsTab({ username }: { username: string }) {
  const [slotFilter, setSlotFilter] = useState<string>(ALL_SLOTS_VALUE);
  const slot = slotFilter === ALL_SLOTS_VALUE ? undefined : Number(slotFilter);
  const { data, isLoading, isError, refetch } = useOverviewRebirths(
    username,
    slot,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data
            ? `${data.totalRebirths} total rebirth${data.totalRebirths === 1 ? "" : "s"}`
            : "Rebirths"}
        </p>
        <Select value={slotFilter} onValueChange={setSlotFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by slot" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SLOTS_VALUE}>All slots</SelectItem>
            {ALL_SLOTS.map((s) => (
              <SelectItem key={s} value={String(s)}>
                Slot {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingState label="Loading rebirths…" />
      ) : isError || !data ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data.slots.length === 0 ? (
        <EmptyState title="No rebirths yet" />
      ) : (
        <div className="space-y-4">
          {data.slots.map((group) => (
            <RebirthSlotCard key={group.slot} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}

function RebirthSlotCard({ group }: { group: RebirthSlotGroup }) {
  const columns: Column<OverviewRebirthRecord>[] = [
    {
      key: "entryId",
      header: "Entry ID",
      cell: (r) => (
        <span className="font-mono text-xs">{r.entryId ?? "—"}</span>
      ),
    },
    {
      key: "bfsIndex",
      header: "BFS Index",
      className: "tabular-nums",
      cell: (r) => r.bfsIndex,
    },
    {
      key: "level",
      header: "Level",
      className: "tabular-nums",
      cell: (r) => r.level,
    },
    {
      key: "rebirthOf",
      header: "Rebirthed From",
      cell: (r) =>
        r.rebirthOf ? (
          <span className="text-xs text-muted-foreground">
            #{r.rebirthOf.bfsIndex} (L{r.rebirthOf.level})
            {r.rebirthOf.completedAt &&
              ` · completed ${formatDateShort(r.rebirthOf.completedAt)}`}
          </span>
        ) : (
          "—"
        ),
    },
    {
      key: "created",
      header: "Re-entered",
      cell: (r) => (
        <span className="text-muted-foreground">
          {formatDateShort(r.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Slot {group.slot}{" "}
          <span className="font-normal text-muted-foreground">
            · {group.count} rebirth{group.count > 1 ? "s" : ""}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={group.rebirths}
          rowKey={(r) => r._id}
          emptyTitle="No rebirths"
        />
      </CardContent>
    </Card>
  );
}

function TreeDialog({
  username,
  slot,
  onOpenChange,
}: {
  username: string;
  slot: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [depth, setDepth] = useState(3);
  const open = slot !== null;
  const {
    data: tree,
    isLoading,
    isError,
    refetch,
  } = useOverviewSlotTree(username, slot ?? 0, depth, open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Slot {slot} tree</DialogTitle>
          <DialogDescription>
            Binary subtree rooted at this user's position in slot {slot}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-end gap-2">
          <Label className="text-xs text-muted-foreground">Depth</Label>
          <Select
            value={String(depth)}
            onValueChange={(v) => setDepth(Number(v))}
          >
            <SelectTrigger className="w-20">
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

        {isLoading ? (
          <LoadingState label="Loading tree…" />
        ) : isError ? (
          <ErrorState
            message="Could not load this slot tree."
            onRetry={() => refetch()}
          />
        ) : !tree ? (
          <EmptyState
            title="No tree data"
            description={`This user has no position in slot ${slot}.`}
          />
        ) : (
          slot !== null && <BinaryTree root={tree} slot={slot} />
        )}
      </DialogContent>
    </Dialog>
  );
}
