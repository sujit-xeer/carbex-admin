import {
  LayoutDashboard,
  Users,
  UserCog,
  GitBranch,
  Network,
  ShoppingCart,
  Coins,
  Activity,
  Link2,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Match exactly (for the index route). */
  end?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard, end: true },
  { label: 'Users', to: '/users', icon: Users },
  { label: 'User Management', to: '/users/manage', icon: UserCog },
  { label: 'Referrals', to: '/referrals', icon: GitBranch },
  { label: 'Slot Trees', to: '/slots/tree', icon: Network },
  { label: 'Slot Purchases', to: '/slots/purchases', icon: ShoppingCart },
  { label: 'Income & Bonus', to: '/income', icon: Coins },
  { label: 'Login Activity', to: '/activity', icon: Activity },
  { label: 'On-chain Events', to: '/onchain', icon: Link2 },
  { label: 'Settings', to: '/settings', icon: Settings },
];
