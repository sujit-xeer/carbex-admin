# Admin 2FA — Frontend Integration Guide

Two-Factor Authentication for the admin panel using TOTP (Google Authenticator, Authy, etc.).

---

## How It Works

| Stage | Endpoints used |
|-------|---------------|
| **Enable 2FA** | `POST /auth/2fa/setup` → scan QR → `POST /auth/2fa/enable` |
| **Login with 2FA** | `POST /auth/login` → returns `twoFactorToken` → `POST /auth/2fa/verify` |
| **Disable 2FA** | `POST /auth/2fa/disable` |

---

## Endpoints

### `POST /api/v1/admin/auth/2fa/setup`

Requires: admin Bearer token  
Generates a TOTP secret and QR code. Does **not** activate 2FA yet — call `/enable` to confirm.

```json
// Response
{
  "qrCodeDataUrl": "data:image/png;base64,iVBOR...",
  "secret": "JBSWY3DPEHPK3PXP",
  "otpauth": "otpauth://totp/Carbex%20Admin%3Aadmin?secret=JBSWY3DPEHPK3PXP&issuer=Carbex%20Admin"
}
```

Display `qrCodeDataUrl` in an `<img>` tag for the admin to scan. Show `secret` as a fallback for manual entry.

---

### `POST /api/v1/admin/auth/2fa/enable`

Requires: admin Bearer token

```json
// Request
{ "code": "123456" }

// Response
{ "enabled": true }
```

The 6-digit code must come from the authenticator app **after scanning the QR code** from `/setup`.  
Returns `400` if the code is wrong or `/setup` was never called.

---

### `POST /api/v1/admin/auth/login` — updated behaviour

When 2FA is **disabled** (original behaviour):
```json
{ "accessToken": "...", "refreshToken": "...", "admin": { ... } }
```

When 2FA is **enabled**, login no longer returns real tokens immediately:
```json
{
  "requiresTwoFactor": true,
  "twoFactorToken": "eyJ..."
}
```
The `twoFactorToken` expires in **5 minutes**. Pass it to `/auth/2fa/verify`.

---

### `POST /api/v1/admin/auth/2fa/verify`

No auth header needed. Rate-limited (same as login).

```json
// Request
{
  "twoFactorToken": "eyJ...",
  "code": "456789"
}

// Response (same as normal login)
{
  "accessToken": "...",
  "refreshToken": "...",
  "admin": { "_id": "...", "username": "admin", "twoFactorEnabled": true }
}
```

| Status | Meaning |
|--------|---------|
| 200 | Login complete |
| 401 | Wrong code, expired token, or already-used token |

---

### `POST /api/v1/admin/auth/2fa/disable`

Requires: admin Bearer token

```json
// Request
{ "code": "654321" }

// Response
{ "enabled": false }
```

Returns `400` if the code is wrong or 2FA is not enabled.

---

## React + Vite Integration

### 1. Add 2FA methods to the API client

Extend `src/api/admin.js`:

```js
export const adminApi = {
  // ... existing methods ...

  // 2FA
  setup2FA:   ()           => post('/admin/auth/2fa/setup'),
  enable2FA:  (code)       => post('/admin/auth/2fa/enable',  { code }),
  disable2FA: (code)       => post('/admin/auth/2fa/disable', { code }),
  verify2FA:  (twoFactorToken, code) =>
    post('/admin/auth/2fa/verify', { twoFactorToken, code })
      .then((data) => { accessToken = data.accessToken; refreshToken = data.refreshToken; return data; }),
};
```

Also update the existing `login` method to handle the 2FA gate:

```js
login: async (username, password) => {
  const data = await post('/admin/auth/login', { username, password });
  if (data.requiresTwoFactor) {
    // Don't store tokens yet — caller must call verify2FA next
    return data; // { requiresTwoFactor: true, twoFactorToken }
  }
  accessToken = data.accessToken;
  refreshToken = data.refreshToken;
  return data;
},
```

---

### 2. Updated Login page

```jsx
// src/pages/admin/AdminLogin.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin';

export default function AdminLogin() {
  const [step, setStep] = useState('credentials'); // 'credentials' | '2fa'
  const [form, setForm] = useState({ username: '', password: '' });
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await adminApi.login(form.username, form.password);
      if (data.requiresTwoFactor) {
        setTwoFactorToken(data.twoFactorToken);
        setStep('2fa');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handle2FA = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await adminApi.verify2FA(twoFactorToken, code);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message);
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  if (step === '2fa') {
    return (
      <form onSubmit={handle2FA}>
        <h2>Enter Authenticator Code</h2>
        <p>Open your authenticator app and enter the 6-digit code.</p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          maxLength={6}
          autoFocus
          inputMode="numeric"
        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={code.length !== 6 || loading}>
          {loading ? 'Verifying...' : 'Verify'}
        </button>
        <button type="button" onClick={() => { setStep('credentials'); setError(null); }}>
          Back to login
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleLogin}>
      <h2>Admin Login</h2>
      <input
        placeholder="Username"
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
      />
      <input
        placeholder="Password"
        type="password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

---

### 3. 2FA Settings page (enable / disable)

```jsx
// src/pages/admin/TwoFactorSettings.jsx
import { useState } from 'react';
import { adminApi } from '../../api/admin';

export default function TwoFactorSettings({ twoFactorEnabled, onStatusChange }) {
  const [stage, setStage] = useState('idle'); // 'idle' | 'setup' | 'enabling' | 'disabling'
  const [qrData, setQrData] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const startSetup = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await adminApi.setup2FA();
      setQrData(data);
      setStage('setup');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await adminApi.enable2FA(code);
      setStage('idle');
      setQrData(null);
      setCode('');
      onStatusChange(true);
    } catch (err) {
      setError(err.message);
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await adminApi.disable2FA(code);
      setStage('idle');
      setCode('');
      onStatusChange(false);
    } catch (err) {
      setError(err.message);
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  // ── QR setup screen ──────────────────────────────────────────────────────────
  if (stage === 'setup') {
    return (
      <div>
        <h3>Scan QR Code</h3>
        <p>Open Google Authenticator, Authy, or any TOTP app and scan this code.</p>
        <img src={qrData.qrCodeDataUrl} alt="2FA QR Code" style={{ width: 200, height: 200 }} />
        <p>
          Can't scan? Enter this key manually: <code>{qrData.secret}</code>
        </p>
        <form onSubmit={handleEnable}>
          <p>Enter the 6-digit code shown in your app to confirm:</p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            autoFocus
            inputMode="numeric"
          />
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit" disabled={code.length !== 6 || loading}>
            {loading ? 'Activating...' : 'Activate 2FA'}
          </button>
          <button type="button" onClick={() => { setStage('idle'); setQrData(null); setCode(''); setError(null); }}>
            Cancel
          </button>
        </form>
      </div>
    );
  }

  // ── Disable screen ──────────────────────────────────────────────────────────
  if (stage === 'disabling') {
    return (
      <div>
        <h3>Disable 2FA</h3>
        <p>Enter the current code from your authenticator app to confirm.</p>
        <form onSubmit={handleDisable}>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            autoFocus
            inputMode="numeric"
          />
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit" disabled={code.length !== 6 || loading}>
            {loading ? 'Disabling...' : 'Disable 2FA'}
          </button>
          <button type="button" onClick={() => { setStage('idle'); setCode(''); setError(null); }}>
            Cancel
          </button>
        </form>
      </div>
    );
  }

  // ── Idle (status view) ──────────────────────────────────────────────────────
  return (
    <div>
      <h3>Two-Factor Authentication</h3>
      <p>Status: <strong>{twoFactorEnabled ? '✓ Enabled' : '✗ Disabled'}</strong></p>
      {twoFactorEnabled ? (
        <button onClick={() => setStage('disabling')}>Disable 2FA</button>
      ) : (
        <button onClick={startSetup} disabled={loading}>
          {loading ? 'Loading...' : 'Enable 2FA'}
        </button>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

### 4. Use in your settings / profile page

```jsx
// src/pages/admin/AdminProfile.jsx
import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import TwoFactorSettings from './TwoFactorSettings';

export default function AdminProfile() {
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    adminApi.me().then((data) => setAdmin(data.admin));
  }, []);

  if (!admin) return <p>Loading...</p>;

  return (
    <div>
      <h2>Profile — {admin.username}</h2>
      <TwoFactorSettings
        twoFactorEnabled={admin.twoFactorEnabled}
        onStatusChange={(enabled) => setAdmin({ ...admin, twoFactorEnabled: enabled })}
      />
    </div>
  );
}
```

---

## Complete Flow Summary

```
Enable 2FA
──────────
1. Admin clicks "Enable 2FA"
2. Frontend calls POST /auth/2fa/setup  → receives { qrCodeDataUrl, secret }
3. Admin scans QR code in their authenticator app
4. Admin enters the 6-digit code shown in the app
5. Frontend calls POST /auth/2fa/enable with { code }
6. 2FA is now active

Login with 2FA active
──────────────────────
1. Admin submits username + password
2. Backend returns { requiresTwoFactor: true, twoFactorToken }
3. Frontend shows the 2FA code input screen
4. Admin enters the 6-digit code from their app
5. Frontend calls POST /auth/2fa/verify with { twoFactorToken, code }
6. Backend returns { accessToken, refreshToken, admin }

Disable 2FA
───────────
1. Admin clicks "Disable 2FA"
2. Frontend shows confirmation screen asking for current TOTP code
3. Admin enters the 6-digit code
4. Frontend calls POST /auth/2fa/disable with { code }
5. 2FA removed from account
```

---

## Security Notes

- The `twoFactorToken` from `/auth/login` expires in **5 minutes**. If it expires, the admin must log in again.
- The TOTP window accepts ±30 seconds of clock drift on the admin's device.
- `twoFactorSecret` is never returned by any API — only `twoFactorEnabled` (boolean) is visible.
- If an admin loses their authenticator app, a superadmin must manually clear `twoFactorEnabled`, `twoFactorSecret`, and `twoFactorPendingSecret` in the database.
