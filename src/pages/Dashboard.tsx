import { Link } from 'react-router-dom';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  Users as UsersIcon,
  UserCheck,
  UserX,
  GitBranch,
  LogIn,
  UserPlus,
  Layers,
  Trophy,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { KpiCard } from '@/components/common/KpiCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AddressDisplay } from '@/components/common/AddressDisplay';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';
import { Badge } from '@/components/ui/badge';
import { useDashboard, useTopReferrers } from '@/api/hooks';
import { formatCompact } from '@/lib/utils';

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--warning))', 'hsl(var(--muted-foreground))'];

export default function DashboardPage() {
  const { data: stats, isLoading, isError, refetch } = useDashboard();
  const { data: topReferrers, isLoading: loadingTop } = useTopReferrers(10);

  const statusData = stats
    ? [
        { name: 'Active', value: stats.activeUsers },
        { name: 'Suspended', value: stats.suspendedUsers },
      ]
    : [];

  const slotData = stats
    ? [
        { name: 'Slot 1', members: stats.slot1Members },
        { name: 'Slot 2', members: stats.slot2Members },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Platform overview and key metrics." />

      {isError ? (
        <ErrorState message="Could not load dashboard stats." onRetry={() => refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Total Users" value={formatCompact(stats?.totalUsers)} icon={UsersIcon} loading={isLoading} />
            <KpiCard label="Active Users" value={formatCompact(stats?.activeUsers)} icon={UserCheck} accent="success" loading={isLoading} />
            <KpiCard label="Suspended" value={formatCompact(stats?.suspendedUsers)} icon={UserX} accent="destructive" loading={isLoading} />
            <KpiCard label="Total Referrals" value={formatCompact(stats?.totalReferrals)} icon={GitBranch} loading={isLoading} />
            <KpiCard label="Total Logins" value={formatCompact(stats?.totalLogins)} icon={LogIn} accent="muted" loading={isLoading} />
            <KpiCard label="New This Month" value={formatCompact(stats?.newUsersThisMonth)} icon={UserPlus} accent="warning" loading={isLoading} />
            <KpiCard label="Slot 1 Members" value={formatCompact(stats?.slot1Members)} icon={Layers} loading={isLoading} />
            <KpiCard label="Slot 2 Members" value={formatCompact(stats?.slot2Members)} icon={Layers} loading={isLoading} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Active vs Suspended</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <LoadingState />
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                        {statusData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i]} />
                        ))}
                      </Pie>
                      <RTooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                <div className="flex justify-center gap-4 text-xs">
                  <Legend color={CHART_COLORS[0]} label={`Active · ${stats?.activeUsers ?? 0}`} />
                  <Legend color={CHART_COLORS[1]} label={`Suspended · ${stats?.suspendedUsers ?? 0}`} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Slot 1 vs Slot 2 Membership</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <LoadingState />
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={slotData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                      <RTooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted)/0.3)' }} />
                      <Bar dataKey="members" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="h-4 w-4 text-warning" /> Top Referrers
                </CardTitle>
                <Link to="/referrals" className="text-xs text-primary hover:underline">
                  View all
                </Link>
              </CardHeader>
              <CardContent>
                {loadingTop ? (
                  <LoadingState />
                ) : !topReferrers || topReferrers.length === 0 ? (
                  <EmptyState title="No referrers yet" />
                ) : (
                  <ol className="space-y-2">
                    {topReferrers.map((r, i) => (
                      <li key={r.referrerId} className="flex items-center gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{r.username}</p>
                          <AddressDisplay address={r.walletAddress} withCopy={false} />
                        </div>
                        <Badge variant="secondary">{r.count}</Badge>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

const tooltipStyle = {
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
  fontSize: 12,
  color: 'hsl(var(--popover-foreground))',
};

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}
