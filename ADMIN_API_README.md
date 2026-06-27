# Admin API — Frontend Integration Guide

Admin panel API. Requires admin username + password login. All protected routes need a Bearer token in the `Authorization` header.

---

## Base URL

```
http://localhost:3000/api/v1/admin
```

All endpoints return:
```json
{ "success": true, "message": "...", "data": { ... } }
```
On error:
```json
{ "success": false, "message": "..." }
```

---

## Authentication

Admin uses username/password auth (not wallet signatures).

### Login
```
POST /admin/auth/login
```
```json
// Request
{ "username": "admin", "password": "changeme123" }

// Response
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "admin": { "_id": "...", "username": "admin" }
}
```

### Refresh token
```
POST /admin/auth/refresh
```
```json
{ "refreshToken": "eyJ..." }
```

### Get current admin
```
GET /admin/auth/me
Authorization: Bearer <accessToken>
```

### Logout
```
POST /admin/auth/logout
Authorization: Bearer <accessToken>
```

---

## Endpoints Reference

All routes below require `Authorization: Bearer <accessToken>`.

### Dashboard

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/dashboard` | System-wide stats (users, slots, income totals) |

### User Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/users` | List all users (paginated, filterable) |
| GET | `/admin/users/:userId` | Get one user's full detail |
| GET | `/admin/users/:userId/incomes` | Income records summary or paginated by type |
| GET | `/admin/users/:userId/slots` | Slot purchase status — owned + available |
| **POST** | **`/admin/users/register`** | **Register a new user under a sponsor — requires 2FA** |
| **POST** | **`/admin/users/:userId/slots`** | **Buy slots on behalf of a user — requires 2FA** |
| POST | `/admin/users/:userId/suspend` | Suspend a user |
| POST | `/admin/users/:userId/unsuspend` | Unsuspend a user |

### Slots

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/slots/tree/:slot` | Full binary tree for a slot |
| GET | `/admin/slots/purchases` | All slot purchases (paginated) |
| GET | `/admin/slots/breakdown` | Node count per level per slot |

### Referrals

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/referrals` | List all referrals (paginated) |
| GET | `/admin/referrals/top` | Top referrers by count |

### Income & Bonuses

| Method | Path | Description |
|--------|------|-------------|
| POST | `/admin/club-bonus/run` | Manually trigger weekly club bonus |
| GET | `/admin/club-bonus` | All club bonus records (paginated) |
| POST | `/admin/direct-performance/run` | Manually trigger monthly direct performance |
| GET | `/admin/direct-performance` | All direct performance records (paginated) |

### Blockchain

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/contract-events` | On-chain events log (paginated) |
| POST | `/admin/stake/process` | Process a stake by tx hash |
| GET | `/admin/login-activity` | Login history (paginated) |

---

## New Endpoints — Detail

### Register a user

```
POST /admin/users/register
```

Registers a new user under a sponsor without any blockchain transaction. Equivalent to running `scripts/adminRegisterUsers.js`.

> **2FA required.** The admin account must have 2FA enabled. Include the current 6-digit TOTP code from your authenticator app in every request.

```json
// Request
{
  "address": "0xNewUserWallet...",
  "sponsorAddress": "0xSponsorWallet...",
  "twoFactorCode": "123456"
}

// Response 200
{
  "user": {
    "walletAddress": "0xnewuserwallet...",
    "username": "auto_abc123",
    "referralCode": "ABC123",
    "referredBy": "...",
    "sponsorWallet": "0xsponsorwallet...",
    "adminInserted": true
  }
}
```

| Status | Meaning |
|--------|---------|
| 200 | User registered |
| 400 | Missing/invalid fields, or missing twoFactorCode, or user cannot sponsor themselves |
| 401 | Invalid authenticator code |
| 403 | 2FA not enabled on admin account |
| 404 | Sponsor wallet not found |
| 409 | Wallet already registered |

---

### Get user slot status

```
GET /admin/users/:userId/slots
```

`:userId` accepts either a **Mongo ObjectId** or a **0x wallet address**.

Shows the full slot catalog with a `purchased` flag on each slot. Use this to see what the user already owns before buying more.

```json
// Response
{
  "user": {
    "_id": "...",
    "walletAddress": "0x...",
    "username": "alice"
  },
  "purchasedCount": 3,
  "availableCount": 9,
  "totalSlots": 12,
  "slots": [
    {
      "slotNumber": 1,
      "amount": 100,
      "purchased": true,
      "entryId": "slot-1-48392017",
      "bfsIndex": 3,
      "level": 1,
      "isCompleted": false,
      "purchasedAt": "2024-01-15T10:00:00.000Z"
    },
    {
      "slotNumber": 2,
      "amount": 200,
      "purchased": true,
      "entryId": "slot-2-77654321",
      "bfsIndex": 5,
      "level": 1,
      "isCompleted": true,
      "purchasedAt": "2024-01-16T12:00:00.000Z"
    },
    {
      "slotNumber": 3,
      "amount": 300,
      "purchased": false
    }
  ]
}
```

---

### Buy slots for a user

```
POST /admin/users/:userId/slots
```

`:userId` accepts either a **Mongo ObjectId** or a **0x wallet address**.

Equivalent to running `scripts/adminBuySlots.js`. Runs the full purchase pipeline (tree placement, referral income, instant level income, rebirth checks) but tags each purchase `adminInserted` with no blockchain transaction.

> **2FA required.** The admin account must have 2FA enabled. Include the current 6-digit TOTP code from your authenticator app in every request.

Already-owned slots are reported as failed entries but **do not stop the rest** of the batch.

```json
// Request — single slot
{ "slot": 3, "twoFactorCode": "123456" }

// Request — multiple slots
{ "slots": [3, 4, 5], "twoFactorCode": "123456" }

// Response
{
  "results": [
    {
      "success": true,
      "slot": 3,
      "slotAmount": 300,
      "entryId": "slot-3-92847561",
      "bfsIndex": 7,
      "level": 2,
      "rebirths": []
    },
    {
      "success": true,
      "slot": 4,
      "slotAmount": 400,
      "entryId": "slot-4-12345678",
      "bfsIndex": 11,
      "level": 3,
      "rebirths": []
    },
    {
      "success": false,
      "slot": 5,
      "error": "Slot 5 already purchased"
    }
  ]
}
```

---

## React + Vite Integration

### 1. API client

Create `src/api/admin.js`:

```js
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

let accessToken = null;
let refreshToken = null;

async function request(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

const get  = (path)        => request('GET', path);
const post = (path, body)  => request('POST', path, body);

export const adminApi = {
  // Auth
  login:   (username, password) => post('/admin/auth/login', { username, password })
    .then((data) => { accessToken = data.accessToken; refreshToken = data.refreshToken; return data; }),
  refresh: ()                   => post('/admin/auth/refresh', { refreshToken })
    .then((data) => { accessToken = data.accessToken; refreshToken = data.refreshToken; return data; }),
  logout:  ()                   => post('/admin/auth/logout', { refreshToken }),
  me:      ()                   => get('/admin/auth/me'),

  // Dashboard
  getDashboard: () => get('/admin/dashboard'),

  // Users
  getUsers:      (params = {}) => get(`/admin/users?${new URLSearchParams(params)}`),
  getUserDetail: (userId)      => get(`/admin/users/${userId}`),
  getUserIncomes:(userId, params = {}) => get(`/admin/users/${userId}/incomes?${new URLSearchParams(params)}`),
  suspendUser:   (userId, reason)      => post(`/admin/users/${userId}/suspend`, { reason }),
  unsuspendUser: (userId)              => post(`/admin/users/${userId}/unsuspend`),

  // New: User registration & slots (both require 2FA — pass twoFactorCode)
  registerUser:  (address, sponsorAddress, twoFactorCode) =>
    post('/admin/users/register', { address, sponsorAddress, twoFactorCode }),
  getUserSlots:  (userId)                                 => get(`/admin/users/${userId}/slots`),
  buyUserSlots:  (userId, slots, twoFactorCode)           =>
    post(`/admin/users/${userId}/slots`, { slots, twoFactorCode }),

  // Slots
  getSlotTree:      (slot, depth = 4) => get(`/admin/slots/tree/${slot}?depth=${depth}`),
  getSlotPurchases: (params = {})     => get(`/admin/slots/purchases?${new URLSearchParams(params)}`),
  getSlotBreakdown: ()                => get('/admin/slots/breakdown'),

  // Referrals
  getReferrals:   (params = {}) => get(`/admin/referrals?${new URLSearchParams(params)}`),
  getTopReferrers:(limit = 10)  => get(`/admin/referrals/top?limit=${limit}`),

  // Income
  runClubBonus:          () => post('/admin/club-bonus/run'),
  getClubBonusHistory:   (params = {}) => get(`/admin/club-bonus?${new URLSearchParams(params)}`),
  runDirectPerformance:  () => post('/admin/direct-performance/run'),
  getDirectPerformanceHistory: (params = {}) => get(`/admin/direct-performance?${new URLSearchParams(params)}`),

  // Blockchain
  getContractEvents: (params = {}) => get(`/admin/contract-events?${new URLSearchParams(params)}`),
  processStake:      (txHash)      => post('/admin/stake/process', { txHash }),
  getLoginActivity:  (params = {}) => get(`/admin/login-activity?${new URLSearchParams(params)}`),
};
```

### 2. `.env` file

```
VITE_API_URL=http://localhost:3000/api/v1
```

### 3. Login page

```jsx
// src/pages/admin/AdminLogin.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin';

export default function AdminLogin() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await adminApi.login(form.username, form.password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="Username" value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })} />
      <input placeholder="Password" type="password" value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })} />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit">Login</button>
    </form>
  );
}
```

### 4. Register user component

This form now requires a 6-digit TOTP code from the admin's authenticator app before the backend will process the registration.

```jsx
// src/pages/admin/RegisterUser.jsx
import { useState } from 'react';
import { adminApi } from '../../api/admin';

export default function RegisterUser() {
  const [form, setForm] = useState({ address: '', sponsorAddress: '', twoFactorCode: '' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const data = await adminApi.registerUser(form.address, form.sponsorAddress, form.twoFactorCode);
      setResult(data.user);
      setForm({ ...form, twoFactorCode: '' }); // clear OTP after use
    } catch (err) {
      setError(err.message);
      setForm({ ...form, twoFactorCode: '' }); // clear OTP on failure too
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Register User</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="User wallet address (0x...)" value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <input placeholder="Sponsor wallet address (0x...)" value={form.sponsorAddress}
          onChange={(e) => setForm({ ...form, sponsorAddress: e.target.value })} />
        <input
          placeholder="Authenticator code (6 digits)"
          value={form.twoFactorCode}
          onChange={(e) => setForm({ ...form, twoFactorCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
          maxLength={6}
          inputMode="numeric"
        />
        <button type="submit" disabled={form.twoFactorCode.length !== 6 || loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      {error  && <p style={{ color: 'red' }}>{error}</p>}
      {result && <p style={{ color: 'green' }}>Registered: {result.username} ({result.walletAddress})</p>}
    </div>
  );
}
```

### 5. User slot management component

Shows purchased slots, available slots, and lets the admin buy remaining slots. A 6-digit TOTP code is now required before the purchase is sent to the server.

```jsx
// src/pages/admin/UserSlots.jsx
import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';

export default function UserSlots({ userId }) {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState([]);
  const [otpCode, setOtpCode] = useState('');
  const [buying, setBuying] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const load = async () => {
    setError(null);
    try {
      const res = await adminApi.getUserSlots(userId);
      setData(res);
      setSelected([]);
      setResults(null);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { load(); }, [userId]);

  const toggleSlot = (slotNumber) => {
    setSelected((prev) =>
      prev.includes(slotNumber)
        ? prev.filter((s) => s !== slotNumber)
        : [...prev, slotNumber]
    );
  };

  const selectAllAvailable = () => {
    const available = data.slots.filter((s) => !s.purchased).map((s) => s.slotNumber);
    setSelected(available);
  };

  const handleBuy = async () => {
    if (!selected.length || otpCode.length !== 6) return;
    setBuying(true);
    setResults(null);
    try {
      const res = await adminApi.buyUserSlots(userId, selected, otpCode);
      setResults(res.results);
      setOtpCode(''); // clear OTP after use
      await load();
    } catch (err) {
      setError(err.message);
      setOtpCode(''); // clear OTP on failure too
    } finally {
      setBuying(false);
    }
  };

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!data)  return <p>Loading...</p>;

  const availableSlots = data.slots.filter((s) => !s.purchased);

  return (
    <div>
      <h2>Slots for {data.user.username} ({data.user.walletAddress})</h2>
      <p>
        Purchased: <strong>{data.purchasedCount}</strong> /
        Available: <strong>{data.availableCount}</strong> /
        Total: <strong>{data.totalSlots}</strong>
      </p>

      {/* Slot grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {data.slots.map((s) => (
          <div
            key={s.slotNumber}
            onClick={() => !s.purchased && toggleSlot(s.slotNumber)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: 6,
              cursor: s.purchased ? 'default' : 'pointer',
              background: s.purchased
                ? '#d4edda'
                : selected.includes(s.slotNumber)
                ? '#cce5ff'
                : '#fff',
              opacity: s.purchased ? 0.7 : 1,
            }}
          >
            <div>Slot {s.slotNumber}</div>
            <div style={{ fontSize: 12 }}>{s.amount} USDT</div>
            {s.purchased ? (
              <div style={{ fontSize: 11, color: '#555' }}>
                Owned · Level {s.level} · Pos {s.bfsIndex}
                {s.isCompleted && ' · Completed'}
              </div>
            ) : (
              <div style={{ fontSize: 11, color: '#007bff' }}>
                {selected.includes(s.slotNumber) ? 'Selected' : 'Available'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Buy controls */}
      {availableSlots.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <button onClick={selectAllAvailable}>Select All Available ({availableSlots.length})</button>
          {selected.length > 0 && (
            <>
              <span style={{ marginLeft: 8, fontSize: 13 }}>
                Selected: Slot {selected.sort((a, b) => a - b).join(', ')}
              </span>
              <div style={{ marginTop: 8 }}>
                <input
                  placeholder="Authenticator code (6 digits)"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  inputMode="numeric"
                  style={{ marginRight: 8 }}
                />
                <button
                  onClick={handleBuy}
                  disabled={otpCode.length !== 6 || buying}
                >
                  {buying ? 'Buying...' : `Buy ${selected.length} Slot(s)`}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Purchase results */}
      {results && (
        <div style={{ marginTop: 16 }}>
          <h4>Purchase Results</h4>
          {results.map((r) => (
            <div key={r.slot} style={{ color: r.success ? 'green' : 'red' }}>
              Slot {r.slot}: {r.success
                ? `✓ Placed at position ${r.bfsIndex} (Level ${r.level})`
                : `✗ ${r.error}`}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 6. Usage in user detail page

```jsx
// src/pages/admin/UserDetail.jsx
import { useParams } from 'react-router-dom';
import UserSlots from './UserSlots';

export default function UserDetail() {
  const { userId } = useParams();
  return (
    <div>
      <h1>User Detail</h1>
      {/* ...other user info... */}
      <UserSlots userId={userId} />
    </div>
  );
}
```

### 7. React Router setup

```jsx
// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLogin    from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserDetail   from './pages/admin/UserDetail';
import RegisterUser from './pages/admin/RegisterUser';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login"              element={<AdminLogin />} />
        <Route path="/admin/dashboard"          element={<AdminDashboard />} />
        <Route path="/admin/users/:userId"      element={<UserDetail />} />
        <Route path="/admin/users/register"     element={<RegisterUser />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Query Parameters

### `GET /admin/users`
| Param | Type | Description |
|-------|------|-------------|
| `page` | integer | Page number (default 1) |
| `limit` | integer | Items per page (default 20) |
| `search` | string | Search by wallet/username/email |
| `role` | string | Filter by `user` or `admin` |
| `isActive` | boolean | Filter by active status |
| `isSuspended` | boolean | Filter by suspended status |

Each user object in the response includes a `slotPurchaseCount` field — the number of **paid** (non-rebirth) slot purchases that user has made.

```json
// Example user object in the items array
{
  "_id": "...",
  "walletAddress": "0x...",
  "username": "alice",
  "isActive": true,
  "isSuspended": false,
  "slotPurchaseCount": 3
}
```

### `GET /admin/users/:userId/incomes`
| Param | Type | Description |
|-------|------|-------------|
| `type` | string | `referral`, `level`, `clubBonus`, or `directPerformance` — omit for summary |
| `page` | integer | Page (only when `type` is set) |
| `limit` | integer | Items per page (only when `type` is set) |

### `GET /admin/slots/purchases`
| Param | Type | Description |
|-------|------|-------------|
| `slot` | integer | Filter to one slot number |
| `page` | integer | Page number |
| `limit` | integer | Items per page |

### `GET /admin/contract-events`
| Param | Type | Description |
|-------|------|-------------|
| `eventName` | string | `Staked` or `Withdrawal` |
| `status` | string | `processed`, `skipped`, or `failed` |
| `page` | integer | Page number |

---

## Notes

- **Token storage**: Store `accessToken` and `refreshToken` in memory or `sessionStorage` — avoid `localStorage` for admin tokens.
- **Token refresh**: Call `adminApi.refresh()` when a request returns 401 and retry automatically.
- **Slot buying is idempotent**: Already-owned slots return `success: false` with an "already purchased" error — they don't break the batch.
- **Register then buy**: Always register a user first before buying slots. The buy endpoint will return 404 if the wallet isn't registered.
- `userId` in slot endpoints accepts both a **Mongo ObjectId** and a **0x wallet address**.
