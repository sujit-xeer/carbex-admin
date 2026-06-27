import { Badge } from '@/components/ui/badge';

export function UserStatusBadge({ isActive, isSuspended }: { isActive: boolean; isSuspended: boolean }) {
  if (isSuspended) return <Badge variant="destructive">Suspended</Badge>;
  if (isActive) return <Badge variant="success">Active</Badge>;
  return <Badge variant="muted">Inactive</Badge>;
}

export function RoleBadge({ role }: { role: string }) {
  return <Badge variant={role === 'admin' ? 'default' : 'secondary'}>{role}</Badge>;
}
