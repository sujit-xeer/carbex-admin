# Carbex Admin

Production-grade admin dashboard for the Carbex Web3 platform — a binary-slot-tree MLM with wallet authentication, multiple income streams, and an on-chain staking contract on BSC testnet.

## Stack

- **React 18 + TypeScript + Vite**
- **Tailwind CSS** + shadcn/ui component primitives (Radix-based)
- **TanStack Query** for data fetching/caching
- **React Router** for routing
- **Axios** client with auth + refresh-on-401 interceptors
- **ethers v6** for the read-only on-chain events fallback reader
- **react-d3-tree** for the binary slot-tree visualization
- **Recharts** for charts
- **sonner** for toasts

## Getting started

```bash
npm install
cp .env.example .env   # adjust if your backend isn't on localhost:3000
npm run dev            # http://localhost:5173
```

The backend must be running and reachable at `VITE_API_URL`. Port `5173` is already in the backend CORS allowlist.

### Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check (`tsc -b`) and produce a production bundle |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | Type-check only |

## Environment

| Var | Description |
| --- | --- |
| `VITE_API_URL` | Backend origin. The app calls `${VITE_API_URL}/api/v1`. |
| `VITE_RPC_URL` | BSC testnet RPC, used by the on-chain events fallback reader. |
| `VITE_CONTRACT_ADDRESS` | CarbexStaking contract address. |

No secrets live in the frontend.

## Authentication

Username/password against the dedicated admin auth module (`/admin/auth/*`):

1. `POST /admin/auth/login` `{ username, password }` → `{ accessToken, refreshToken, admin }`
2. Reject unless `admin.role` is `admin` or `superadmin`
3. `GET /admin/auth/me` revalidates a rehydrated session on load
4. `POST /admin/auth/logout` `{ refreshToken }`

Tokens: access (~15m) held in memory + mirrored to storage, refresh (~7d) persisted (rotated on refresh). On `401`, the axios interceptor calls `POST /admin/auth/refresh` once and retries; if that fails it logs out. All `/admin/*` data endpoints require the admin JWT. Routes are gated by `AdminGuard` (authenticated **and** an admin role).

## Pages

| Route | Page |
| --- | --- |
| `/` | Dashboard — KPI cards, charts, top referrers |
| `/users` | Users — server search/filter/pagination, suspend/unsuspend |
| `/users/:userId` | User detail — profile, income balances, related views |
| `/referrals` | Referral genealogy |
| `/slots/tree` | Interactive binary slot-tree (react-d3-tree) + per-level breakdown |
| `/slots/purchases` | Slot purchases with on-chain stake/tx links |
| `/income` | Club bonus (weekly) & direct performance (monthly) — run + history |
| `/activity` | Login activity |
| `/onchain` | Contract events — backend-indexed, with an ethers read-from-chain fallback |

## API contract notes

The backend wraps every response as `{ success, message, data }`; the client unwraps `data`. Most lists use `data = { items, pagination }`, **except** club-bonus and direct-performance history which return `{ records, total, page, pages }` (adapted in the Income page). Dashboard returns `data.stats`, top referrers `data.referrers`, slot tree `data.tree`, breakdown `data.breakdown`.

The `/admin/contract-events` endpoint exists and is the primary source for the On-chain page; the ethers-based reader (`src/lib/onchain.ts`) is the read-only fallback.

## Project structure

```
src/
  api/        # axios client, token store, typed query hooks, types
  auth/       # AuthContext (wallet sign-in), AdminGuard
  components/
    ui/       # shadcn/ui primitives
    common/   # DataTable, Pagination, KpiCard, states, dialogs, AddressDisplay…
    layout/   # Sidebar, Topbar, AppLayout
    tree/     # BinaryTree (react-d3-tree)
  lib/        # utils, wallet helpers, constants, onchain reader
  pages/      # one file per route
```
