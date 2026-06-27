import { useRef, useState } from 'react';
import { ShieldCheck, ShieldOff, ShieldAlert, Copy, Check } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/auth/AuthContext';
import { useDisable2FA, useEnable2FA, useSetup2FA } from '@/api/hooks';
import type { TwoFactorSetupData } from '@/api/types';
import { formatDate } from '@/lib/utils';

type TwoFAStage = 'idle' | 'setup' | 'disabling';

export default function SettingsPage() {
  const { admin, refreshAdmin } = useAuth();
  const [stage, setStage] = useState<TwoFAStage>('idle');
  const [qrData, setQrData] = useState<TwoFactorSetupData | null>(null);
  const [code, setCode] = useState('');
  const [secretCopied, setSecretCopied] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  const setup = useSetup2FA();
  const enable = useEnable2FA();
  const disable = useDisable2FA();

  const twoFactorEnabled = admin?.twoFactorEnabled ?? false;

  const handleStartSetup = () => {
    setup.mutate(undefined, {
      onSuccess: (data) => {
        setQrData(data);
        setCode('');
        setStage('setup');
        setTimeout(() => codeRef.current?.focus(), 100);
      },
    });
  };

  const handleEnable = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    enable.mutate(code, {
      onSuccess: async () => {
        await refreshAdmin();
        setStage('idle');
        setQrData(null);
        setCode('');
      },
      onError: () => setCode(''),
    });
  };

  const handleDisable = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    disable.mutate(code, {
      onSuccess: async () => {
        await refreshAdmin();
        setStage('idle');
        setCode('');
      },
      onError: () => setCode(''),
    });
  };

  const handleCancelSetup = () => {
    setStage('idle');
    setQrData(null);
    setCode('');
  };

  const handleCopySecret = () => {
    if (!qrData?.secret) return;
    navigator.clipboard.writeText(qrData.secret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your admin account and security preferences." />

      {/* ── Account info ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">Username</dt>
              <dd className="mt-0.5 font-medium">@{admin?.username}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Display name</dt>
              <dd className="mt-0.5 font-medium">{admin?.name || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Role</dt>
              <dd className="mt-0.5">
                <Badge variant={admin?.role === 'superadmin' ? 'default' : 'secondary'} className="capitalize">
                  {admin?.role}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Last login</dt>
              <dd className="mt-0.5 text-muted-foreground">{formatDate(admin?.lastLogin)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Member since</dt>
              <dd className="mt-0.5 text-muted-foreground">{formatDate(admin?.createdAt)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* ── Two-Factor Authentication ────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              {twoFactorEnabled ? (
                <ShieldCheck className="h-4 w-4 text-primary" />
              ) : (
                <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              )}
              Two-factor authentication
            </CardTitle>
            <CardDescription className="mt-1">
              {twoFactorEnabled
                ? 'Your account is protected with a TOTP authenticator.'
                : 'Add an extra layer of security to your account.'}
            </CardDescription>
          </div>
          <Badge variant={twoFactorEnabled ? 'default' : 'outline'} className="shrink-0">
            {twoFactorEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* ── Idle: disabled ────────────────────────────────────────── */}
          {stage === 'idle' && !twoFactorEnabled && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Use Google Authenticator, Authy, or any TOTP-compatible app to generate one-time codes.
              </p>
              <Button onClick={handleStartSetup} loading={setup.isPending}>
                <ShieldCheck className="h-4 w-4" /> Enable 2FA
              </Button>
            </div>
          )}

          {/* ── Idle: enabled ─────────────────────────────────────────── */}
          {stage === 'idle' && twoFactorEnabled && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                2FA is active. You will be asked for a code each time you sign in.
              </p>
              <Button
                variant="destructive"
                onClick={() => {
                  setCode('');
                  setStage('disabling');
                  setTimeout(() => codeRef.current?.focus(), 100);
                }}
              >
                <ShieldOff className="h-4 w-4" /> Disable 2FA
              </Button>
            </div>
          )}

          {/* ── Setup: QR + activation ─────────────────────────────────── */}
          {stage === 'setup' && qrData && (
            <div className="space-y-5">
              <div className="space-y-1">
                <p className="text-sm font-medium">Step 1 — Scan the QR code</p>
                <p className="text-sm text-muted-foreground">
                  Open your authenticator app and scan the code below.
                </p>
              </div>

              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <img
                  src={qrData.qrCodeDataUrl}
                  alt="2FA QR Code"
                  className="h-44 w-44 shrink-0 rounded-lg border bg-white p-1"
                />
                <div className="w-full space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Can't scan? Enter this key manually in your app:
                  </p>
                  <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
                    <code className="flex-1 break-all font-mono text-xs">{qrData.secret}</code>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={handleCopySecret}
                      aria-label="Copy secret"
                    >
                      {secretCopied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Account type: Time-based (TOTP)
                  </p>
                </div>
              </div>

              <Separator />

              <form className="space-y-4" onSubmit={handleEnable}>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Step 2 — Confirm with a code</p>
                  <p className="text-sm text-muted-foreground">
                    Enter the 6-digit code shown in your app to activate 2FA.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="setup-code">Authenticator code</Label>
                  <Input
                    ref={codeRef}
                    id="setup-code"
                    className="w-48 text-center font-mono text-xl tracking-[0.4em]"
                    placeholder="000000"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" loading={enable.isPending} disabled={code.length !== 6}>
                    Activate 2FA
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancelSetup}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* ── Disabling: code confirmation ────────────────────────────── */}
          {stage === 'disabling' && (
            <form className="space-y-4" onSubmit={handleDisable}>
              <p className="text-sm text-muted-foreground">
                Enter the current code from your authenticator app to confirm.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="disable-code">Authenticator code</Label>
                <Input
                  ref={codeRef}
                  id="disable-code"
                  className="w-48 text-center font-mono text-xl tracking-[0.4em]"
                  placeholder="000000"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="destructive" loading={disable.isPending} disabled={code.length !== 6}>
                  Disable 2FA
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStage('idle');
                    setCode('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
