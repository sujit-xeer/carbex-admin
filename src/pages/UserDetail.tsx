import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, RotateCcw, Coins, ShoppingCart, Network } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { AddressDisplay } from '@/components/common/AddressDisplay';
import { RoleBadge, UserStatusBadge } from '@/components/common/StatusBadge';
import { ErrorState, LoadingState } from '@/components/common/states';
import { SuspendDialog } from '@/components/common/SuspendDialog';
import { CopyButton } from '@/components/common/CopyButton';
import { UserSlotsCard } from '@/components/common/UserSlotsCard';
import { useUnsuspendUser, useUser, useUserIncomes } from '@/api/hooks';
import { formatDate, formatUsdt } from '@/lib/utils';
import { API_URL } from '@/lib/constants';

export default function UserDetailPage() {
  const { userId = '' } = useParams();
  const { data: user, isLoading, isError, refetch } = useUser(userId);
  const { data: incomes } = useUserIncomes(userId);
  const unsuspend = useUnsuspendUser();
  const [suspendOpen, setSuspendOpen] = useState(false);

  if (isLoading) return <LoadingState label="Loading user…" />;
  if (isError || !user) return <ErrorState message="Could not load this user." onRetry={() => refetch()} />;

  const totalIncome =
    user.referralIncome + user.levelIncome + user.clubBonusIncome + user.directPerformanceIncome;

  const profileSrc = user.profileImage
    ? user.profileImage.startsWith('http')
      ? user.profileImage
      : `${API_URL}/${user.profileImage.replace(/^\//, '')}`
    : undefined;

  return (
    <div className="space-y-6">
      <Link to="/users" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to users
      </Link>

      <PageHeader
        title={user.username}
        description="Full account profile, balances and tree links."
        actions={
          user.isSuspended ? (
            <Button variant="outline" loading={unsuspend.isPending} onClick={() => unsuspend.mutate({ userId })}>
              <RotateCcw className="h-4 w-4" /> Unsuspend
            </Button>
          ) : (
            <Button variant="destructive" onClick={() => setSuspendOpen(true)}>
              <Ban className="h-4 w-4" /> Suspend
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14">
                {profileSrc && <AvatarImage src={profileSrc} alt={user.username} />}
                <AvatarFallback className="text-lg">{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{user.username}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <RoleBadge role={user.role} />
                  <UserStatusBadge isActive={user.isActive} isSuspended={user.isSuspended} />
                </div>
              </div>
            </div>

            {user.isSuspended && user.suspendedReason && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                <span className="font-medium">Suspended:</span> {user.suspendedReason}
              </div>
            )}

            <Separator />

            <dl className="space-y-2.5 text-sm">
              <Field label="Wallet">
                <AddressDisplay address={user.walletAddress} withLink />
              </Field>
              <Field label="Email">{user.email || '—'}</Field>
              <Field label="Referral code">
                <span className="inline-flex items-center gap-1 font-mono text-xs">
                  {user.referralCode}
                  <CopyButton value={user.referralCode} label="Code copied" />
                </span>
              </Field>
              <Field label="Sponsor wallet">
                <AddressDisplay address={user.sponsorWallet} />
              </Field>
              <Field label="Referred by">
                <span className="font-mono text-xs text-muted-foreground">{user.referredBy || '—'}</span>
              </Field>
              <Field label="Login count">{user.loginCount}</Field>
              <Field label="Last login">{formatDate(user.lastLogin)}</Field>
              <Field label="Joined">{formatDate(user.createdAt)}</Field>
            </dl>
          </CardContent>
        </Card>

        {/* Income + links */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Coins className="h-4 w-4 text-primary" /> Income balances
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                Total <span className="font-semibold text-foreground tabular-nums">{formatUsdt(totalIncome)}</span> USDT
              </span>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <IncomeStat label="Referral" value={user.referralIncome} count={incomes?.records.referral?.count} />
              <IncomeStat label="Level" value={user.levelIncome} count={incomes?.records.level?.count} />
              <IncomeStat label="Club bonus" value={user.clubBonusIncome} count={incomes?.records.clubBonus?.count} />
              <IncomeStat
                label="Direct perf."
                value={user.directPerformanceIncome}
                count={incomes?.records.directPerformance?.count}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Related views</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <Link to={`/slots/purchases?wallet=${user.walletAddress}`}>
                  <ShoppingCart className="h-4 w-4" /> Slot purchases
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/slots/tree?wallet=${user.walletAddress}`}>
                  <Network className="h-4 w-4" /> Tree position
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <UserSlotsCard userId={userId} readOnly />

      <SuspendDialog userId={userId} username={user.username} open={suspendOpen} onOpenChange={setSuspendOpen} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

function IncomeStat({ label, value, count }: { label: string; value: number; count?: number }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{formatUsdt(value)}</p>
      {count !== undefined && (
        <Badge variant="muted" className="mt-1">
          {count} records
        </Badge>
      )}
    </div>
  );
}

