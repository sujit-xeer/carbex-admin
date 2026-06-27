// ─── Response envelope ──────────────────────────────────────────────────────
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: { field?: string; message: string }[];
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

/** Non-standard pagination shape used by club-bonus & direct-performance history. */
export interface RecordsPaged<T> {
  records: T[];
  total: number;
  page: number;
  pages: number;
}

// ─── Admin auth (username/password) ───────────────────────────────────────────
export type AdminRole = 'admin' | 'superadmin';

export interface Admin {
  _id: string;
  username: string;
  name: string | null;
  role: AdminRole;
  isActive: boolean;
  twoFactorEnabled?: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  admin: Admin;
}

/** Returned by POST /auth/login when the account has 2FA enabled. */
export interface TwoFactorRequiredResponse {
  requiresTwoFactor: true;
  twoFactorToken: string;
}

/** Union of both possible login outcomes. */
export type LoginApiResponse = LoginResponse | TwoFactorRequiredResponse;

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

/** Returned by POST /auth/2fa/setup. */
export interface TwoFactorSetupData {
  qrCodeDataUrl: string;
  secret: string;
  otpauth: string;
}

// ─── Platform users (data domain) ─────────────────────────────────────────────
export type Role = 'user' | 'admin';

export interface User {
  _id: string;
  walletAddress: string;
  username: string;
  email?: string | null;
  profileImage?: string | null;
  referralCode: string;
  referredBy?: string | null;
  sponsorWallet?: string | null;
  role: Role;
  isActive: boolean;
  isSuspended: boolean;
  suspendedReason?: string | null;
  referralIncome: number;
  levelIncome: number;
  clubBonusIncome: number;
  directPerformanceIncome: number;
  loginCount: number;
  slotPurchaseCount: number;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt?: string;
}

// ─── Dashboard ──────────────────────────────────────────────────────────────
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalReferrals: number;
  totalLogins: number;
  newUsersThisMonth: number;
  slot1Members: number;
  slot2Members: number;
}

export interface TopReferrer {
  referrerId: string;
  count: number;
  walletAddress: string;
  username: string;
}

// ─── Referrals ──────────────────────────────────────────────────────────────
export interface ReferralParty {
  _id: string;
  walletAddress: string;
  username: string;
  createdAt?: string;
}

export interface Referral {
  _id: string;
  referrer: ReferralParty | null;
  referredUser: ReferralParty | null;
  level: number;
  status: string;
  createdAt: string;
}

// ─── Slots ──────────────────────────────────────────────────────────────────
export interface SlotCatalogItem {
  slotNumber: number;
  amount: number;
  isActive: boolean;
}

export type ChildPosition = 'root' | 'left' | 'right';

export interface TreeUser {
  walletAddress: string;
  username: string;
  profileImage?: string | null;
}

export interface SlotTreeNode {
  _id?: string;
  slot: number;
  bfsIndex: number;
  level: number;
  childPosition: ChildPosition;
  entryId?: string;
  userWallet: string;
  isCompleted?: boolean;
  user: TreeUser | null;
  leftChild: SlotTreeNode | null;
  rightChild: SlotTreeNode | null;
}

export interface SlotPurchase {
  _id: string;
  user: { _id: string; walletAddress: string; username: string } | null;
  slot: number;
  entryId?: string;
  bfsIndex: number;
  level: number;
  isCompleted: boolean;
  completedAt?: string | null;
  isRebirth: boolean;
  rebirthOf?: string | null;
  stakeId?: string | null;
  txHash?: string | null;
  createdAt: string;
}

export interface LevelBreakdownEntry {
  level: number;
  count: number;
}

/** breakdown: { slot1: [...], slot2: [...], ... } */
export type SlotBreakdown = Record<string, LevelBreakdownEntry[]>;

// ─── Income / bonus ─────────────────────────────────────────────────────────
export interface ClubBonusRecord {
  _id: string;
  user: { _id: string; walletAddress: string; username: string } | null;
  amount: number;
  periodStart?: string;
  periodEnd?: string;
  createdAt: string;
}

export interface DirectPerformanceRecord {
  _id: string;
  user: { _id: string; walletAddress: string; username: string } | null;
  amount: number;
  periodStart?: string;
  periodEnd?: string;
  createdAt: string;
}

export interface DistributionRunResult {
  skipped?: boolean;
  count?: number;
  total?: number;
  periodStart?: string;
  periodEnd?: string;
  [key: string]: unknown;
}

// ─── Login activity ─────────────────────────────────────────────────────────
export interface LoginActivity {
  _id: string;
  user: { _id: string; walletAddress: string; username: string } | null;
  walletAddress: string;
  ipAddress?: string;
  userAgent?: string;
  loginTime: string;
}

// ─── Contract events ────────────────────────────────────────────────────────
export type ContractEventName = 'Staked' | 'Withdrawal';
export type ContractEventStatus = 'processed' | 'skipped' | 'failed';

export interface ContractEvent {
  _id: string;
  eventName: ContractEventName | string;
  txHash: string;
  logIndex: number;
  blockNumber: number;
  args: Record<string, unknown>;
  status: ContractEventStatus | string;
  note?: string | null;
  createdAt: string;
}

// ─── Manual stake processing ─────────────────────────────────────────────────
export interface ProcessedStakeEvent {
  id: string; // `${txHash}:${logIndex}`
  eventName: string;
  status: 'processed' | 'skipped' | 'failed' | string;
  note?: string | null;
}

export interface ProcessStakeResult {
  txHash: string;
  blockNumber: number;
  events: ProcessedStakeEvent[];
}

// ─── User incomes summary (per user) ────────────────────────────────────────
export interface UserIncomeSummary {
  balances: {
    referral: number;
    level: number;
    clubBonus: number;
    directPerformance: number;
  };
  records: Record<string, { total: number; count: number }>;
}

// ─── Admin: Register user ────────────────────────────────────────────────────
export interface RegisteredUser {
  walletAddress: string;
  username: string;
  referralCode: string;
  referredBy: string | null;
  sponsorWallet: string | null;
  adminInserted: boolean;
}

export interface RegisterUserResult {
  user: RegisteredUser;
}

// ─── Admin: User slots ───────────────────────────────────────────────────────
export interface UserSlotEntry {
  slotNumber: number;
  amount: number;
  purchased: boolean;
  entryId?: string;
  bfsIndex?: number;
  level?: number;
  isCompleted?: boolean;
  purchasedAt?: string;
}

export interface UserSlotsData {
  user: { _id: string; walletAddress: string; username: string };
  purchasedCount: number;
  availableCount: number;
  totalSlots: number;
  slots: UserSlotEntry[];
}

export interface BuySlotSuccess {
  success: true;
  slot: number;
  slotAmount: number;
  entryId: string;
  bfsIndex: number;
  level: number;
  rebirths: string[];
}

export interface BuySlotFailure {
  success: false;
  slot: number;
  error: string;
}

export type BuySlotResult = BuySlotSuccess | BuySlotFailure;

export interface BuySlotsData {
  results: BuySlotResult[];
}
