export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const API_BASE = `${API_URL}/api/v1`;

export const RPC_URL = import.meta.env.VITE_RPC_URL || 'https://bsc-testnet-rpc.publicnode.com';
export const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS || '0xdead30351E9b6e4Fd1736B6d85B1FF84F7FB855F';

export const ACCESS_TOKEN_KEY = 'carbex_admin_access_token';
export const REFRESH_TOKEN_KEY = 'carbex_admin_refresh_token';
export const ADMIN_KEY = 'carbex_admin';

/** 15-slot catalog amounts (USDT), 1-based slotNumber -> amount. Fallback when /slot/list is unavailable. */
export const SLOT_AMOUNTS: Record<number, number> = {
  1: 10,
  2: 50,
  3: 100,
  4: 250,
  5: 500,
  6: 1500,
  7: 3000,
  8: 6000,
  9: 12000,
  10: 33000,
  11: 66000,
  12: 99000,
  13: 150000,
  14: 225000,
  15: 300000,
};

export const ALL_SLOTS = Object.keys(SLOT_AMOUNTS).map(Number);

/** A binary tree completes at depth 4 → 2 + 4 + 8 + 16 = 30 nodes below root. */
export const TREE_COMPLETE_NODES = 30;

/** Minimal ABI for the on-chain events fallback reader. */
export const STAKING_EVENT_ABI = [
  'event Staked(bytes32 id, address user, uint256 amount, uint256 usdtValue, uint8 slotIndex, address referral)',
  'event Withdrawal(address user, uint256 amount, uint256 tokenAmount, uint256 actualAmount, uint256 percentage)',
];

/** Income model copy shown in the Income page info panel. */
export const INCOME_MODEL = {
  referral: 'Referral income — 40% of the slot amount, paid instantly to the direct sponsor.',
  level:
    'Level income — paid instantly on each purchase to up to 4 uplines (L1 3%, L2 7%, L3 10%, L4 20%). Rebirth purchases do not pay level income.',
  clubBonus: 'Club bonus — distributed weekly (idempotent per week).',
  directPerformance: 'Direct performance bonus — distributed monthly (idempotent per month).',
  rebirth:
    'A position completes when its tree fills to depth 4 (30 nodes), triggering an automatic rebirth re-entry.',
} as const;
