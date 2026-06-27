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
import { useRegisterUser } from '@/api/hooks';

interface RegisterUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function isValidAddress(value: string) {
  return /^0x[0-9a-fA-F]{40}$/.test(value.trim());
}

export function RegisterUserDialog({ open, onOpenChange }: RegisterUserDialogProps) {
  const [address, setAddress] = useState('');
  const [sponsorAddress, setSponsorAddress] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const register = useRegisterUser();

  const isValid = isValidAddress(address) && isValidAddress(sponsorAddress) && twoFactorCode.length === 6;

  const handleSubmit = () => {
    if (!isValid) return;
    register.mutate(
      { address: address.trim(), sponsorAddress: sponsorAddress.trim(), twoFactorCode },
      {
        onSuccess: () => {
          setAddress('');
          setSponsorAddress('');
          setTwoFactorCode('');
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register user</DialogTitle>
          <DialogDescription>
            Register a new wallet under a sponsor without a blockchain transaction. The user must not already be
            registered.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reg-address">User wallet address</Label>
            <Input
              id="reg-address"
              placeholder="0x…"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg-sponsor">Sponsor wallet address</Label>
            <Input
              id="reg-sponsor"
              placeholder="0x…"
              value={sponsorAddress}
              onChange={(e) => setSponsorAddress(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg-2fa">Authenticator code</Label>
            <Input
              id="reg-2fa"
              placeholder="6-digit code"
              inputMode="numeric"
              maxLength={6}
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button loading={register.isPending} disabled={!isValid} onClick={handleSubmit}>
            Register
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
