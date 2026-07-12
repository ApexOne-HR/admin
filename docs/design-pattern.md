# Admin site — Design pattern

## Goal

Thin UI over the Laravel Admin API: **Page → Hook (TanStack Query) → Service → apiClient → `/api/admin`**.

```text
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐     ┌────────────┐
│ Page / UI   │────▶│ hooks (useQuery) │────▶│ services/   │────▶│ apiClient  │
│ MUI + shared│◀────│ useMutation      │◀────│ apiRequest  │◀────│ fetch JSON │
└─────────────┘     └──────────────────┘     └─────────────┘     └─────┬──────┘
                                                                      │
                                                                      ▼
                                                            Laravel /api/admin
```

## Layers

| Layer | Responsibility | Must not |
|-------|----------------|----------|
| **Page** | Layout, forms, wire hooks, permission-gated buttons | Call `fetch` directly |
| **Hook** | TanStack Query keys, cache, mutate + invalidate | Own raw URL strings (use service) |
| **Service** | Map to API paths/payloads; return `data` | Use React hooks |
| **apiClient** | Headers, Bearer token, parse envelope, throw `ApiError` | Know domain types beyond generics |
| **Laravel API** | Auth, RBAC, business rules | — |

## API contract

- Docs: `api/docs/api/admin/collections/{feature}.md`
- Errors: `api/docs/api/admin/ERRORS.md` (do not invent error shapes)
- Success envelope:

```json
{
  "success": true,
  "message": "string|null",
  "data": {},
  "meta": {}
}
```

Use `response.data` in UI. Pagination lives in `response.meta` when present.

## Auth pattern (Sanctum)

1. `POST /auth/login` → store `token` + `user`
2. Boot: token present → `GET /auth/me`; `401` → clear → `/login`
3. All protected calls: `apiRequest(path, { token })`
4. `POST /auth/logout` → clear local session

Session provider wraps the app (`AdminSessionProvider`). Token + user are stored in `localStorage` under `apex-hr-admin-session`.

## RBAC UI pattern

- Multiple roles per user: `user.roles[]` (may be empty)
- Gate with permission slugs across all active roles: `user.roles[].permissions[].slug`
- Example: show “Create role” only if `can(user, 'roles.create')`
- Permission matrix save: send **full** `permission_ids` (replace), never a partial diff
- User roles save: send **full** `role_ids` (replace), never a partial diff

## TanStack Query conventions

- Query keys: `['admin', '{resource}', ...params]` e.g. `['admin', 'roles']`, `['admin', 'users', { page }]`
- Mutations invalidate related keys after success
- Defaults already set in `app/providers.tsx` (`staleTime`, `retry`, no refetch on focus)
- Prefer Query for server state; keep form draft state local (`useState`)

## Example flow (roles list)

```text
RolesPage
  → useRolesQuery(token)
    → rolesService.list(token)
      → apiRequest<Role[]>('/roles', { token })
        → GET {VITE_API_BASE_URL}/api/admin/roles
```

## UI composition

- Shell: `AdminLayout` + `Sidebar` (from `config/navigation.ts`) + `Navbar`
- Lists: `AppTable` + `EmptyState` / `ErrorState` / `AppLoader`
- Dialogs: `AppModal`
- Confirm / toast: `useConfirm()` + `useToast()` from `@/components/common/feedback`
- Prefer MUI for forms/controls; Tailwind for layout utilities
- Forms: mark required fields with `required` (red `*` via theme); validate with `validateRequiredFields` from `@/components/common/form`

## Adding a new Admin feature (checklist)

1. Confirm API collection exists under `api/docs/api/admin/collections/`
2. Create `src/features/{feature}/` (types, services, hooks, pages)
3. Register nav in `navigation.ts` and route in `router.tsx`
4. Gate actions with permission slugs
5. Handle `401` / `403` / `422` / `429` per `ERRORS.md`

## Anti-patterns

- Calling Laravel from components without a service
- Duplicating envelope parsing outside `apiClient`
- Storing passwords or long-lived secrets in `localStorage` beyond the Sanctum token
- Using `/api/frontend` endpoints from Admin
- Adding Supabase or another backend client
