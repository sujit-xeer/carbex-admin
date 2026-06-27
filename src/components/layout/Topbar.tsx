import { LogOut, Menu, Settings, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/auth/AuthContext';

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { admin, logout } = useAuth();
  const displayName = admin?.name || admin?.username || 'Admin';
  const initials = (admin?.name || admin?.username || 'AD').slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={onMenuClick} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
        <h2 className="hidden text-sm font-medium text-muted-foreground sm:block">Admin Console</h2>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-9 gap-2 px-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="hidden text-left leading-tight sm:block">
              <p className="text-xs font-medium">{displayName}</p>
              <p className="text-[10px] capitalize text-muted-foreground">{admin?.role}</p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex items-center justify-between gap-2 leading-tight">
              <div>
                <p className="text-sm">{displayName}</p>
                <p className="text-[10px] text-muted-foreground">@{admin?.username}</p>
              </div>
              {admin?.role && (
                <Badge variant={admin.role === 'superadmin' ? 'default' : 'secondary'} className="capitalize">
                  {admin.role}
                </Badge>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/settings">
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          {admin?.twoFactorEnabled && (
            <DropdownMenuItem asChild>
              <Link to="/settings" className="text-primary">
                <ShieldCheck className="h-4 w-4" />
                2FA active
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => logout()}>
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
