import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Hexagon, Lock, User as UserIcon, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/auth/AuthContext';

interface LocationState {
  from?: { pathname: string };
}

type Step = 'credentials' | '2fa';

export default function LoginPage() {
  const { isAuthenticated, isAdmin, loggingIn, login, verify2FA } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from?.pathname ?? '/';

  const [step, setStep] = useState<Step>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [code, setCode] = useState('');
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAuthenticated && isAdmin) navigate(from, { replace: true });
  }, [isAuthenticated, isAdmin, from, navigate]);

  // Focus OTP input when step switches
  useEffect(() => {
    if (step === '2fa') codeRef.current?.focus();
  }, [step]);

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    const result = await login(username, password);

    if ('requiresTwoFactor' in result) {
      setTwoFactorToken(result.twoFactorToken);
      setStep('2fa');
    } else if (result.ok) {
      navigate(from, { replace: true });
    }
  };

  const handle2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;

    const ok = await verify2FA(twoFactorToken, code);
    if (ok) {
      navigate(from, { replace: true });
    } else {
      setCode('');
    }
  };

  const handleBack = () => {
    setStep('credentials');
    setCode('');
    setTwoFactorToken('');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,hsl(var(--primary)/0.12),transparent_60%)]" />

      <Card className="relative w-full max-w-md">
        {step === 'credentials' ? (
          <>
            <CardHeader className="items-center text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Hexagon className="h-7 w-7" />
              </div>
              <CardTitle className="text-xl">Carbex Admin</CardTitle>
              <CardDescription>Sign in with your admin credentials.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleCredentials}>
                <div className="space-y-1.5">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="username"
                      className="pl-8"
                      placeholder="admin"
                      autoComplete="username"
                      autoFocus
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className="pl-8 pr-9"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  loading={loggingIn}
                  disabled={!username.trim() || !password}
                >
                  {loggingIn ? 'Signing in…' : 'Sign in'}
                </Button>
              </form>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="items-center text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <CardTitle className="text-xl">Two-factor authentication</CardTitle>
              <CardDescription>
                Enter the 6-digit code from your authenticator app. The code expires in 5 minutes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handle2FA}>
                <div className="space-y-1.5">
                  <Label htmlFor="otp-code">Authenticator code</Label>
                  <Input
                    ref={codeRef}
                    id="otp-code"
                    className="text-center text-2xl font-mono tracking-[0.4em]"
                    placeholder="000000"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  loading={loggingIn}
                  disabled={code.length !== 6}
                >
                  {loggingIn ? 'Verifying…' : 'Verify'}
                </Button>

                <button
                  type="button"
                  onClick={handleBack}
                  className="flex w-full items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to login
                </button>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
