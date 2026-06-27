# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server at http://localhost:5173
npm run build      # Type-check (tsc -b) + Vite production build
npm run preview    # Preview production build locally
npm run typecheck  # Type-check only (no emit)
npm run lint       # ESLint on .ts/.tsx files
```

## Environment Variables

```
VITE_API_URL            # Backend origin (default: http://localhost:3000); app appends /api/v1
VITE_RPC_URL            # BSC testnet RPC endpoint
VITE_CONTRACT_ADDRESS   # CarbexStaking contract address
```

## Architecture

**Carbex Admin** is a React 18 + TypeScript + Vite dashboard for a BSC-based binary-slot-tree MLM platform. It has no backend — it's a pure SPA that talks to a REST API and optionally reads on-chain events via ethers.js.

### Layer Map

| Layer | Path | Role |
|-------|------|------|
| Entry | `src/main.tsx` | Mounts `QueryClientProvider` → `AuthProvider` → `App` |
| Router | `src/App.tsx` | React Router 6 with lazy-loaded pages and `AdminGuard` wrapper |
| Auth | `src/auth/` | `AuthContext` (session state), `AdminGuard` (route protection) |
| API client | `src/api/client.ts` | Axios instance + 401-refresh interceptor |
| Token store | `src/api/tokenStore.ts` | Memory + localStorage with cross-tab observable |
| Query hooks | `src/api/hooks.ts` | All TanStack Query v5 hooks; query key factory at `qk.*` |
| Types | `src/api/types.ts` | All API entity and response types |
| Pages | `src/pages/` | One file per route, lazy-loaded |
| Layout | `src/components/layout/` | `AppLayout` (sidebar + topbar), `Sidebar`, `Topbar`, `nav.ts` |
| Common | `src/components/common/` | `DataTable`, `Pagination`, `KpiCard`, `AddressDisplay`, `StatusBadge`, `SuspendDialog`, `states.tsx` |
| UI primitives | `src/components/ui/` | shadcn/ui wrappers over Radix UI |
| Utilities | `src/lib/` | `constants.ts` (API base, ABI, slot amounts), `utils.ts` (formatUsdt, formatDate, cn), `onchain.ts` (ethers fallback reader) |

### Authentication Flow

1. `Login.tsx` → `POST /admin/auth/login` → receives `{ accessToken, refreshToken, admin }`
2. Access token lives in **memory** (+ localStorage backup); refresh token in localStorage
3. Axios request interceptor attaches `Authorization: Bearer <accessToken>`
4. On 401: interceptor calls `POST /admin/auth/refresh`, retries once; on failure it invokes `onAuthFailure()` which clears tokens and redirects to login
5. `AdminGuard` blocks all protected routes unless authenticated AND role is `admin` or `superadmin`

### Data Fetching Conventions

- All API responses: `{ success: boolean, message: string, data: T }`
- Most paginated lists: `data = { items: T[], pagination: { page, limit, total, pages } }`
- Club bonus / direct performance history: `data = { records: T[], total, page, pages }`
- Hooks unwrap `data` before returning; mutations show Sonner toasts on success/error
- Use `placeholderData: keepPreviousData` for pagination transitions

### On-Chain Fallback

`src/lib/onchain.ts` reads contract events directly via ethers.js v6 when the backend `/admin/contract-events` endpoint is unavailable. The contract ABI fragment and RPC URL live in `src/lib/constants.ts`.

### Styling

- Dark mode only (set via `dark` class on `<html>`)
- Tailwind CSS with HSL CSS variables for all theme colors (primary: green 142°)
- Component variants via `class-variance-authority`; class merging via `cn()` from `src/lib/utils.ts`
- Radix UI primitives + shadcn/ui in `src/components/ui/`

### TypeScript

Strict mode with `noUnusedLocals` and `noUnusedParameters` enforced. Path alias `@/*` → `src/*`. Vite handles transpilation; `tsc -b` is type-check only (no emit).
