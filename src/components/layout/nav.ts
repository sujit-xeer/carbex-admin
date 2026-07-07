import {
  LayoutDashboard,
  Users,
  UserSearch,
  GitBranch,
  Network,
  ShoppingCart,
  Coins,
  Activity,
  Link2,
  Settings,
  Layers,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Match exactly (for the index route). */
  end?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard, end: true },
  { label: "Users", to: "/users", icon: Users },
  // { label: 'User Management', to: '/users/manage', icon: UserCog },
  { label: "User Overview", to: "/users/overview", icon: UserSearch },
  { label: "Referrals", to: "/referrals", icon: GitBranch },
  { label: "Slot Summary", to: "/slots/overview", icon: Layers },
  { label: "Slot Trees", to: "/slots/tree", icon: Network },
  { label: "Slot Purchases", to: "/slots/purchases", icon: ShoppingCart },
  { label: "Income & Bonus", to: "/income", icon: Coins },
  { label: "Login Activity", to: "/activity", icon: Activity },
  { label: "On-chain Events", to: "/onchain", icon: Link2 },
  { label: "Withdrawals", to: "/withdrawals", icon: Wallet },
  { label: "Settings", to: "/settings", icon: Settings },
];
