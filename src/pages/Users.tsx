import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, Search, Ban, RotateCcw, MoreHorizontal } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { AddressDisplay } from '@/components/common/AddressDisplay';
import { CopyButton } from '@/components/common/CopyButton';
import { UserStatusBadge } from '@/components/common/StatusBadge';
import { SuspendDialog } from '@/components/common/SuspendDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUnsuspendUser, useUsers } from '@/api/hooks';
import type { User } from '@/api/types';
import { useDebounce } from '@/lib/useDebounce';
import { formatDateShort, formatUsdt } from '@/lib/utils';

const LIMIT = 20;
const ALL = '__all__';

export default function UsersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');
  const [role, setRole] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);
  const search = useDebounce(searchInput, 400);

  const filters = useMemo(() => {
    const f: { isActive?: string; isSuspended?: string } = {};
    if (status === 'active') {
      f.isActive = 'true';
      f.isSuspended = 'false';
    } else if (status === 'suspended') {
      f.isSuspended = 'true';
    }
    return f;
  }, [status]);

  const { data, isLoading, isError, refetch } = useUsers({
    page,
    limit: LIMIT,
    search: search || undefined,
    role: role === ALL ? undefined : role,
    ...filters,
  });

  const unsuspend = useUnsuspendUser();
  const [suspendTarget, setSuspendTarget] = useState<User | null>(null);

  const resetToFirstPage = () => setPage(1);

  const columns: Column<User>[] = [
    {
      key: 'username',
      header: 'Username',
      cell: (u) => (
        <span className="inline-flex items-center gap-1 font-medium">
          {u.username}
          <CopyButton value={u.username} label="Username copied" />
        </span>
      ),
    },
    {
      key: 'wallet',
      header: 'User Address',
      cell: (u) => <AddressDisplay address={u.walletAddress} />,
    },
    {
      key: 'sponsorWallet',
      header: 'Sponsor Address',
      cell: (u) => <AddressDisplay address={u.sponsorWallet} />,
    },
    {
      key: 'slots',
      header: 'Slots',
      className: 'tabular-nums',
      cell: (u) => u.slotPurchaseCount,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (u) => <UserStatusBadge isActive={u.isActive} isSuspended={u.isSuspended} />,
    },
    {
      key: 'income',
      header: 'Income (Ref / Lvl / Club / DP)',
      headClassName: 'text-right',
      className: 'text-right tabular-nums text-xs',
      cell: (u) => (
        <span className="whitespace-nowrap">
          {formatUsdt(u.referralIncome)} / {formatUsdt(u.levelIncome)} / {formatUsdt(u.clubBonusIncome)} /{' '}
          {formatUsdt(u.directPerformanceIncome)}
        </span>
      ),
    },
    {
      key: 'logins',
      header: 'Logins',
      className: 'tabular-nums',
      cell: (u) => u.loginCount,
    },
    {
      key: 'lastLogin',
      header: 'Last login',
      cell: (u) => <span className="text-muted-foreground">{formatDateShort(u.lastLogin)}</span>,
    },
    {
      key: 'created',
      header: 'Created',
      cell: (u) => <span className="text-muted-foreground">{formatDateShort(u.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      headClassName: 'w-10',
      cell: (u) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/users/${u._id}`)}>
              <Eye className="h-4 w-4" /> View detail
            </DropdownMenuItem>
            {u.isSuspended ? (
              <DropdownMenuItem onClick={() => unsuspend.mutate({ userId: u._id })}>
                <RotateCcw className="h-4 w-4" /> Unsuspend
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => setSuspendTarget(u)} className="text-destructive">
                <Ban className="h-4 w-4" /> Suspend
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Users" description="Search, filter and manage platform accounts." />

      <Card className="p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search by wallet, username or email…"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                resetToFirstPage();
              }}
            />
          </div>
          <Select
            value={role}
            onValueChange={(v) => {
              setRole(v);
              resetToFirstPage();
            }}
          >
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All roles</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <DataTable
        columns={columns}
        data={data?.items}
        rowKey={(u) => u._id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        onRowClick={(u) => navigate(`/users/${u._id}`)}
        emptyTitle="No users match your filters"
      />

      <Pagination pagination={data?.pagination} page={page} onPageChange={setPage} />

      {suspendTarget && (
        <SuspendDialog
          userId={suspendTarget._id}
          username={suspendTarget.username}
          open={!!suspendTarget}
          onOpenChange={(o) => !o && setSuspendTarget(null)}
        />
      )}
    </div>
  );
}
