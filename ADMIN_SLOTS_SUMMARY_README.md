# Admin — Slot Summary & Slot Users — Frontend Integration Prompt

Copy everything below into your frontend AI coding tool (or use it as a spec) to wire up two new admin-only endpoints: a slot-by-slot user-count summary, and a paginated user list for a specific slot.

---

## Prompt

```
Add an admin "Slots" overview page to the React admin panel.

Base URL: the existing admin API client (bearer token auth, same as other
/api/v1/admin/* calls already used in the admin panel).

New endpoints (admin-only, require the admin bearer token):

1. GET /api/v1/admin/slots/summary
   Returns every slot in the catalog with how many users own it.

   Response:
   {
     "success": true,
     "message": "Success",
     "data": {
       "summary": [
         { "slotNumber": 1, "amount": 10, "isActive": true, "userCount": 186 },
         { "slotNumber": 2, "amount": 50, "isActive": true, "userCount": 155 }
       ]
     }
   }

   userCount only counts real purchases — rebirth (re-entry) positions are
   excluded, so it reflects distinct paying users per slot.

2. GET /api/v1/admin/slots/:slot/users?page=1&limit=20
   Returns the paginated list of users who own a given slot, with wallet,
   status and their purchase/tree-position detail.

   Response:
   {
     "success": true,
     "message": "Success",
     "data": {
       "slot": 1,
       "items": [
         {
           "_id": "...",
           "walletAddress": "0xabc...",
           "username": "CARBEX207",
           "profileImage": null,
           "isActive": true,
           "isSuspended": false,
           "entryId": "slot-1-72369597",
           "bfsIndex": 107545,
           "level": 16,
           "isCompleted": false,
           "purchasedAt": "2026-07-03T05:34:31.695Z"
         }
       ],
       "pagination": {
         "total": 186,
         "page": 1,
         "limit": 20,
         "totalPages": 10,
         "hasNext": true,
         "hasPrev": false
       }
     }
   }

   isActive on each user reflects whether they've purchased at least one
   slot (the account-active flag), not the slot in this list specifically.

Build:

1. `src/api/adminSlots.js` — two functions using the existing authenticated
   admin fetch/axios instance:
   - getSlotsSummary() -> GET /admin/slots/summary, return data.summary
   - getSlotUsers(slot, { page, limit }) -> GET /admin/slots/${slot}/users,
     return data (has slot, items, pagination)

2. `src/pages/admin/SlotsOverview.jsx`
   - On mount, call getSlotsSummary() and render a table/grid of slots:
     Slot # | Amount | Active (catalog) | Users
   - Each row's "Users" cell is a button/link that opens a modal or navigates
     to a per-slot detail view.

3. `src/pages/admin/SlotUsersModal.jsx` (or a route `/admin/slots/:slot/users`)
   - Given `slot`, call getSlotUsers(slot, { page }) and render a paginated
     table: Username | Wallet | Active | Suspended | Position (bfsIndex /
     level) | Purchased At
   - Standard prev/next pagination using `pagination.hasPrev` /
     `pagination.hasNext` / `pagination.totalPages`.

Match the existing admin panel's table/pagination components and styling
instead of introducing new ones.
```

---

## Notes

- Both endpoints require the same admin bearer token as every other
  `/api/v1/admin/*` route — no new auth wiring needed.
- `userCount` / the users list only count **paid** purchases; a user's
  rebirth (auto re-entry) positions in the same slot are not counted again.
- `page`/`limit` follow the same convention as the rest of the admin API
  (`limit` capped at 100, default 20).
