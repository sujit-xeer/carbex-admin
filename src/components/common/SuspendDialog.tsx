import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useSuspendUser } from '@/api/hooks';

interface SuspendDialogProps {
  userId: string;
  username?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SuspendDialog({ userId, username, open, onOpenChange }: SuspendDialogProps) {
  const [reason, setReason] = useState('');
  const suspend = useSuspendUser();

  const handleSubmit = () => {
    if (!reason.trim()) return;
    suspend.mutate(
      { userId, reason: reason.trim() },
      {
        onSuccess: () => {
          setReason('');
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suspend user</DialogTitle>
          <DialogDescription>
            Suspending {username ? <span className="font-medium text-foreground">{username}</span> : 'this user'} will
            deactivate the account and end active sessions. A reason is required.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="suspend-reason">Reason</Label>
          <Input
            id="suspend-reason"
            placeholder="e.g. Fraudulent activity"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            loading={suspend.isPending}
            disabled={!reason.trim()}
            onClick={handleSubmit}
          >
            Suspend
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
