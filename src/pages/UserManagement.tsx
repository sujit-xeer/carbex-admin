import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserPlus, Coins, ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AddressDisplay } from '@/components/common/AddressDisplay';
import { RoleBadge, UserStatusBadge } from '@/components/common/StatusBadge';
import { UserSlotsCard } from '@/components/common/UserSlotsCard';
import { useRegisterUser, useUserIncomes, useUsers } from '@/api/hooks';
import type { User } from '@/api/types';
import { cn, formatDate, formatUsdt } from '@/lib/utils';

function isValidAddress(v: string) {
  return /^0x[0-9a-fA-F]{40}$/.test(v.trim());
}

export default function UserManagementPage() {
  // ── find user ──────────────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data: searchData, isFetching: searching } = useUsers(
    { page: 1, limit: 8, search: searchQuery },
    !!searchQuery
  );

  const handleSearch = () => {
    const q = searchInput.trim();
    if (!q) return;
    setSelectedUser(null);
    setSearchQuery(q);
  };

  // ── register ───────────────────────────────────────────────────────────────
  const [regAddress, setRegAddress] = useState('');
  const [regSponsor, setRegSponsor] = useState('');
  const register = useRegisterUser();

  const regValid = isValidAddress(regAddress) && isValidAddress(regSponsor);
  const [confirmRegisterOpen, setConfirmRegisterOpen] = useState(false);
  const [regOtp, setRegOtp] = useState('');

  const handleRegister = (twoFactorCode: string) => {
    if (!regValid) return;
    register.mutate(
      { address: regAddress.trim(), sponsorAddress: regSponsor.trim(), twoFactorCode },
      {
        onSuccess: (data) => {
          const wallet = data.user.walletAddress;
          setRegAddress('');
          setRegSponsor('');
          // Auto-search the newly registered wallet
          setSearchInput(wallet);
          setSearchQuery(wallet);
          setSelectedUser(null);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Look up any user to view their profile and purchase slots, or register a new account."
      />

      {/* ── Find User ──────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4 text-primary" /> Find user
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search by username or wallet address…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} loading={searching && !!searchQuery} disabled={!searchInput.trim()}>
              Search
            </Button>
          </div>

          {searchQuery && (
            <>
              {searching ? (
                <p className="text-sm text-muted-foreground">Searching…</p>
              ) : !searchData?.items.length ? (
                <p className="text-sm text-muted-foreground">
                  No users found for <span className="font-medium text-foreground">"{searchQuery}"</span>.
                </p>
              ) : (
                <div className="space-y-1">
                  {searchData.items.map((u) => (
                    <button
                      key={u._id}
                      type="button"
                      onClick={() => setSelectedUser(u)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                        selectedUser?._id === u._id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/40'
                      )}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                        {u.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-medium">{u.username}</span>
                          <RoleBadge role={u.role} />
                          <UserStatusBadge isActive={u.isActive} isSuspended={u.isSuspended} />
                        </div>
                        <AddressDisplay address={u.walletAddress} className="mt-0.5 text-muted-foreground" />
                      </div>
                      {selectedUser?._id === u._id && (
                        <Badge variant="secondary" className="shrink-0">
                          Selected
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Selected User Panel ─────────────────────────────────────────────── */}
      {selectedUser && (
        <>
          <UserProfileCard user={selectedUser} />
          <UserSlotsCard userId={selectedUser._id} />
        </>
      )}

      {/* ── Register New User ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4 text-primary" /> Register new user
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="reg-address">User wallet address</Label>
              <Input
                id="reg-address"
                placeholder="0x…"
                value={regAddress}
                onChange={(e) => setRegAddress(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-sponsor">Sponsor wallet address</Label>
              <Input
                id="reg-sponsor"
                placeholder="0x…"
                value={regSponsor}
                onChange={(e) => setRegSponsor(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Registers the wallet without a blockchain transaction. The sponsor must already be registered.
          </p>
          <Button disabled={!regValid} onClick={() => setConfirmRegisterOpen(true)}>
            Register user
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={confirmRegisterOpen}
        onOpenChange={(open) => {
          setConfirmRegisterOpen(open);
          if (!open) setRegOtp('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm user registration</DialogTitle>
            <DialogDescription>
              Review the details below, then enter your authenticator code to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 rounded-md border bg-muted/20 p-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="shrink-0 text-muted-foreground">Wallet</span>
              <span className="truncate font-mono text-xs">{regAddress}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="shrink-0 text-muted-foreground">Sponsor</span>
              <span className="truncate font-mono text-xs">{regSponsor}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg-otp">Authenticator code</Label>
            <Input
              id="reg-otp"
              placeholder="6-digit code"
              inputMode="numeric"
              maxLength={6}
              value={regOtp}
              onChange={(e) => setRegOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRegisterOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={register.isPending}
              disabled={regOtp.length !== 6}
              onClick={() => {
                setConfirmRegisterOpen(false);
                handleRegister(regOtp);
                setRegOtp('');
              }}
            >
              Confirm registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function UserProfileCard({ user }: { user: User }) {
  const { data: incomes } = useUserIncomes(user._id);

  const totalIncome = user.referralIncome + user.levelIncome + user.clubBonusIncome + user.directPerformanceIncome;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">{user.username}</CardTitle>
            <RoleBadge role={user.role} />
            <UserStatusBadge isActive={user.isActive} isSuspended={user.isSuspended} />
          </div>
          <AddressDisplay address={user.walletAddress} withLink className="mt-1 text-muted-foreground" />
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/users/${user._id}`}>
            <ExternalLink className="h-3.5 w-3.5" /> Full profile
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Details grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3 lg:grid-cols-4">
          <Detail label="Referral code">
            <span className="font-mono text-xs">{user.referralCode}</span>
          </Detail>
          <Detail label="Sponsor">
            <AddressDisplay address={user.sponsorWallet} />
          </Detail>
          <Detail label="Referred by">
            <span className="font-mono text-xs text-muted-foreground">{user.referredBy ?? '—'}</span>
          </Detail>
          <Detail label="Login count">{user.loginCount}</Detail>
          <Detail label="Last login">{formatDate(user.lastLogin)}</Detail>
          <Detail label="Joined">{formatDate(user.createdAt)}</Detail>
          {user.isSuspended && user.suspendedReason && (
            <Detail label="Suspend reason" className="col-span-2 lg:col-span-4">
              <span className="text-destructive">{user.suspendedReason}</span>
            </Detail>
          )}
        </div>

        <Separator />

        {/* Income */}
        <div>
          <p className="mb-3 flex items-center justify-between text-sm font-medium">
            <span className="flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-primary" /> Income balances
            </span>
            <span className="text-muted-foreground">
              Total{' '}
              <span className="font-semibold tabular-nums text-foreground">{formatUsdt(totalIncome)}</span> USDT
            </span>
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <IncomeStat label="Referral" value={user.referralIncome} count={incomes?.records.referral?.count} />
            <IncomeStat label="Level" value={user.levelIncome} count={incomes?.records.level?.count} />
            <IncomeStat label="Club bonus" value={user.clubBonusIncome} count={incomes?.records.clubBonus?.count} />
            <IncomeStat
              label="Direct perf."
              value={user.directPerformanceIncome}
              count={incomes?.records.directPerformance?.count}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Detail({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm">{children}</div>
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
