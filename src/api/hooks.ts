import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient, getErrorMessage, unwrap } from './client';
import type {
  BuySlotsData,
  BuySlotResult,
  ClubBonusRecord,
  TwoFactorSetupData,
  ContractEvent,
  DashboardStats,
  DirectPerformanceRecord,
  DistributionRunResult,
  LoginActivity,
  Paginated,
  ProcessStakeResult,
  Referral,
  RecordsPaged,
  RegisterUserResult,
  SlotBreakdown,
  SlotCatalogItem,
  SlotPurchase,
  SlotTreeNode,
  TopReferrer,
  User,
  UserIncomeSummary,
  UserSlotsData,
} from './types';

// ─── Query key factory ────────────────────────────────────────────────────────
export const qk = {
  dashboard: ['dashboard'] as const,
  topReferrers: (limit: number) => ['referrals', 'top', limit] as const,
  users: (params: UsersParams) => ['users', params] as const,
  user: (id: string) => ['users', id] as const,
  userIncomes: (id: string) => ['users', id, 'incomes'] as const,
  userSlots: (id: string) => ['users', id, 'slots'] as const,
  referrals: (page: number, limit: number) => ['referrals', page, limit] as const,
  slotCatalog: ['slots', 'catalog'] as const,
  slotTree: (slot: number, depth: number) => ['slots', 'tree', slot, depth] as const,
  slotBreakdown: ['slots', 'breakdown'] as const,
  slotPurchases: (params: PurchasesParams) => ['slots', 'purchases', params] as const,
  clubBonus: (page: number, limit: number) => ['club-bonus', page, limit] as const,
  directPerformance: (page: number, limit: number) => ['direct-performance', page, limit] as const,
  loginActivity: (params: ActivityParams) => ['login-activity', params] as const,
  contractEvents: (params: ContractEventsParams) => ['contract-events', params] as const,
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export function useDashboard() {
  return useQuery({
    queryKey: qk.dashboard,
    queryFn: () => unwrap<{ stats: DashboardStats }>(apiClient.get('/admin/dashboard')).then((d) => d.stats),
  });
}

export function useTopReferrers(limit = 10) {
  return useQuery({
    queryKey: qk.topReferrers(limit),
    queryFn: () =>
      unwrap<{ referrers: TopReferrer[] }>(apiClient.get('/admin/referrals/top', { params: { limit } })).then(
        (d) => d.referrers
      ),
  });
}

// ─── Users ────────────────────────────────────────────────────────────────────
export interface UsersParams {
  page: number;
  limit: number;
  search?: string;
  role?: string;
  isActive?: string;
  isSuspended?: string;
}

export function useUsers(params: UsersParams, enabled = true) {
  return useQuery({
    queryKey: qk.users(params),
    queryFn: () => unwrap<Paginated<User>>(apiClient.get('/admin/users', { params: cleanParams(params) })),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: qk.user(userId),
    queryFn: () => unwrap<{ user: User }>(apiClient.get(`/admin/users/${userId}`)).then((d) => d.user),
    enabled: !!userId,
  });
}

export function useUserIncomes(userId: string) {
  return useQuery({
    queryKey: qk.userIncomes(userId),
    queryFn: () => unwrap<UserIncomeSummary>(apiClient.get(`/admin/users/${userId}/incomes`)),
    enabled: !!userId,
  });
}

export function useSuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      unwrap<{ user: User }>(apiClient.post(`/admin/users/${userId}/suspend`, { reason })),
    onSuccess: (_data, vars) => {
      toast.success('User suspended');
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: qk.user(vars.userId) });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useRegisterUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      address,
      sponsorAddress,
      twoFactorCode,
    }: {
      address: string;
      sponsorAddress: string;
      twoFactorCode: string;
    }) => unwrap<RegisterUserResult>(apiClient.post('/admin/users/register', { address, sponsorAddress, twoFactorCode })),
    onSuccess: (data) => {
      toast.success(`Registered ${data.user.username}`);
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useUnsuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      unwrap<{ user: User }>(apiClient.post(`/admin/users/${userId}/unsuspend`)),
    onSuccess: (_data, vars) => {
      toast.success('User unsuspended');
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: qk.user(vars.userId) });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useUserSlots(userId: string) {
  return useQuery({
    queryKey: qk.userSlots(userId),
    queryFn: () => unwrap<UserSlotsData>(apiClient.get(`/admin/users/${userId}/slots`)),
    enabled: !!userId,
  });
}

export function useBuyUserSlots() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, slots, twoFactorCode }: { userId: string; slots: number[]; twoFactorCode: string }) =>
      unwrap<BuySlotsData>(apiClient.post(`/admin/users/${userId}/slots`, { slots, twoFactorCode })),
    onSuccess: (data, vars) => {
      const succeeded = data.results.filter((r: BuySlotResult) => r.success).length;
      const failed = data.results.filter((r: BuySlotResult) => !r.success).length;
      if (succeeded > 0 && failed > 0) {
        toast.warning(`${succeeded} purchased, ${failed} failed`);
      } else if (succeeded > 0) {
        toast.success(`${succeeded} slot${succeeded > 1 ? 's' : ''} purchased`);
      } else {
        toast.error('All slot purchases failed');
      }
      qc.invalidateQueries({ queryKey: qk.userSlots(vars.userId) });
      qc.invalidateQueries({ queryKey: ['slots'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

// ─── Referrals ──────────────────────────────────────────────────────────────
export function useReferrals(page: number, limit: number) {
  return useQuery({
    queryKey: qk.referrals(page, limit),
    queryFn: () => unwrap<Paginated<Referral>>(apiClient.get('/admin/referrals', { params: { page, limit } })),
    placeholderData: keepPreviousData,
  });
}

// ─── Slots ────────────────────────────────────────────────────────────────────
export function useSlotCatalog() {
  return useQuery({
    queryKey: qk.slotCatalog,
    queryFn: () => unwrap<{ slots: SlotCatalogItem[] }>(apiClient.get('/slot/list')).then((d) => d.slots),
    staleTime: 0,
  });
}

export function useSlotTree(slot: number, depth: number) {
  return useQuery({
    queryKey: qk.slotTree(slot, depth),
    queryFn: () =>
      unwrap<{ slot: number; tree: SlotTreeNode | null }>(
        apiClient.get(`/admin/slots/tree/${slot}`, { params: { depth } })
      ).then((d) => d.tree),
  });
}

export function useSlotBreakdown() {
  return useQuery({
    queryKey: qk.slotBreakdown,
    queryFn: () =>
      unwrap<{ breakdown: SlotBreakdown }>(apiClient.get('/admin/slots/breakdown')).then((d) => d.breakdown),
  });
}

export interface PurchasesParams {
  page: number;
  limit: number;
  slot?: number;
}

export function useSlotPurchases(params: PurchasesParams) {
  return useQuery({
    queryKey: qk.slotPurchases(params),
    queryFn: () =>
      unwrap<Paginated<SlotPurchase>>(apiClient.get('/admin/slots/purchases', { params: cleanParams(params) })),
    placeholderData: keepPreviousData,
  });
}

// ─── Income / bonus ─────────────────────────────────────────────────────────
export function useClubBonus(page: number, limit: number) {
  return useQuery({
    queryKey: qk.clubBonus(page, limit),
    queryFn: () =>
      unwrap<RecordsPaged<ClubBonusRecord>>(apiClient.get('/admin/club-bonus', { params: { page, limit } })),
    placeholderData: keepPreviousData,
  });
}

export function useRunClubBonus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => unwrap<DistributionRunResult>(apiClient.post('/admin/club-bonus/run')),
    onSuccess: (data) => {
      toast.success(data.skipped ? 'Already distributed for this week' : 'Club bonus distribution executed');
      qc.invalidateQueries({ queryKey: ['club-bonus'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useDirectPerformance(page: number, limit: number) {
  return useQuery({
    queryKey: qk.directPerformance(page, limit),
    queryFn: () =>
      unwrap<RecordsPaged<DirectPerformanceRecord>>(
        apiClient.get('/admin/direct-performance', { params: { page, limit } })
      ),
    placeholderData: keepPreviousData,
  });
}

export function useRunDirectPerformance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => unwrap<DistributionRunResult>(apiClient.post('/admin/direct-performance/run')),
    onSuccess: (data) => {
      toast.success(data.skipped ? 'Already distributed for this month' : 'Direct performance distribution executed');
      qc.invalidateQueries({ queryKey: ['direct-performance'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

// ─── Login activity ─────────────────────────────────────────────────────────
export interface ActivityParams {
  page: number;
  limit: number;
  userId?: string;
}

export function useLoginActivity(params: ActivityParams) {
  return useQuery({
    queryKey: qk.loginActivity(params),
    queryFn: () =>
      unwrap<Paginated<LoginActivity>>(apiClient.get('/admin/login-activity', { params: cleanParams(params) })),
    placeholderData: keepPreviousData,
  });
}

// ─── Contract events ────────────────────────────────────────────────────────
export interface ContractEventsParams {
  page: number;
  limit: number;
  eventName?: string;
  status?: string;
}

export function useContractEvents(params: ContractEventsParams) {
  return useQuery({
    queryKey: qk.contractEvents(params),
    queryFn: () =>
      unwrap<Paginated<ContractEvent>>(apiClient.get('/admin/contract-events', { params: cleanParams(params) })),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

// ─── Manual stake processing ──────────────────────────────────────────────────
export function useProcessStake() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (txHash: string) =>
      unwrap<ProcessStakeResult>(apiClient.post('/admin/stake/process', { txHash })),
    onSuccess: (data) => {
      console.log("data : ",data);
      
      const failed = data.events.filter((e) => e.status === 'failed').length;
      const processed = data.events.filter((e) => e.status === 'processed').length;
      const skipped = data.events.filter((e) => e.status === 'skipped').length;
      if (failed > 0) {
        toast.warning(`Processed with ${failed} failed event${failed > 1 ? 's' : ''}`);
      } else if (processed === 0 && skipped > 0) {
        toast.info('Already processed (idempotent)');
      } else {
        toast.success(`Stake processed · ${processed} placed`);
      }
      qc.invalidateQueries({ queryKey: ['contract-events'] });
      qc.invalidateQueries({ queryKey: ['chain-events'] });
      qc.invalidateQueries({ queryKey: ['slots'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

// ─── 2FA ─────────────────────────────────────────────────────────────────────
export function useSetup2FA() {
  return useMutation({
    mutationFn: () => unwrap<TwoFactorSetupData>(apiClient.post('/admin/auth/2fa/setup')),
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useEnable2FA() {
  return useMutation({
    mutationFn: (code: string) =>
      unwrap<{ enabled: boolean }>(apiClient.post('/admin/auth/2fa/enable', { code })),
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useDisable2FA() {
  return useMutation({
    mutationFn: (code: string) =>
      unwrap<{ enabled: boolean }>(apiClient.post('/admin/auth/2fa/disable', { code })),
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function cleanParams<T extends object>(params: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '' && v !== null) out[k] = v;
  }
  return out as Partial<T>;
}
