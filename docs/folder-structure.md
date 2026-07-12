# Admin site — Folder structure

Root: `admin/`

```text
admin/
├── docs/                          # This documentation
├── public/                        # Static assets (logo, favicon)
├── src/
│   ├── app/                       # App shell: providers, router, route guards
│   │   ├── providers.tsx          # MUI + TanStack Query + session provider
│   │   ├── router.tsx             # createBrowserRouter
│   │   └── routes/                # LoginRoute, ProtectedRoute, placeholders
│   ├── components/
│   │   ├── common/                # Reusable UI (AppTable, AppModal, …)
│   │   └── layout/                # AdminLayout, Sidebar, Navbar, PageHeader
│   ├── config/
│   │   ├── env.ts                 # VITE_* (apiBaseUrl)
│   │   └── navigation.ts          # Sidebar menu + paths
│   ├── features/                  # Feature modules (domain UI)
│   │   └── auth/                  # Example feature
│   │       ├── hooks/
│   │       ├── pages/
│   │       ├── services/
│   │       └── types/
│   ├── infra/
│   │   └── http/
│   │       └── apiClient.ts       # fetch wrapper → /api/admin
│   ├── theme/                     # MUI theme + palette + Tailwind tokens
│   ├── styles/                    # Global CSS (if any)
│   ├── assets/
│   ├── hooks/                     # App-wide hooks (non-feature)
│   ├── types/                     # Shared TS types (non-feature)
│   ├── App.tsx
│   └── main.tsx
├── .env / .env.example
├── package.json
└── vite.config.ts
```

## What goes where

| Concern | Location |
|---------|----------|
| New screen / domain | `src/features/{name}/` |
| Shared button/table/modal | `src/components/common/` |
| Shell layout / sidebar | `src/components/layout/` |
| Menu item | `src/config/navigation.ts` |
| Route registration | `src/app/router.tsx` (+ real page element) |
| HTTP to Laravel | `src/infra/http/apiClient.ts` (+ feature `services/`) |
| Env / API host | `src/config/env.ts` + `.env` |
| Theme | `src/theme/` |

## Feature module layout (required for new features)

```text
src/features/{feature}/
├── types/           # API-aligned TypeScript types
├── services/        # Thin apiRequest wrappers (no React)
├── hooks/           # useQuery / useMutation / local UI hooks
├── pages/           # Route-level pages
└── components/      # Feature-only UI (optional)
```

Examples of upcoming features: `rbac` (roles/users), `employees`, `payroll`.

## Do not put

| Avoid | Prefer |
|-------|--------|
| API calls inside page JSX | `services/` + TanStack hooks |
| Feature UI in `components/common` | `features/{x}/components/` |
| Supabase / random BaaS clients | `infra/http/apiClient` only |
| Hardcoded API host in features | `env.apiBaseUrl` / `adminApiBaseUrl` |
| Social modules (posts, comments) | HR Admin menus only |

## Path alias

`@/` → `src/` (Vite/TS config).
