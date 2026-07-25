# Admin site — Folder structure

Root: `admin/`

```text
admin/
├── docs/
├── public/
├── src/
│   ├── app/                 # providers, router, route guards, ComingSoonPage
│   ├── components/
│   │   ├── common/          # AppTable, AppModal, AppButton, SessionLoadingScreen, …
│   │   └── layout/          # AdminLayout, Sidebar, Navbar, PageHeader
│   ├── config/              # env, navigation
│   ├── features/
│   │   ├── auth/            # login + session
│   │   ├── organization/    # companies, divisions, departments, designations
│   │   └── rbac/            # users, roles, permissions pages
│   ├── infra/http/          # apiClient + getApiErrorMessage
│   ├── styles/
│   ├── theme/
│   ├── App.tsx
│   └── main.tsx
├── .env / .env.example
└── package.json
```

## Feature module layout

```text
src/features/{feature}/
├── types/
├── services/      # apiRequest wrappers
├── hooks/         # TanStack Query
├── pages/
└── components/    # feature-only UI (optional)
```

## Routes (current)

| Path | Page |
|------|------|
| `/login` | Login |
| `/dashboard` | Coming soon |
| `/organization` | Org hierarchy (companies → designations) |
| `/users` | RBAC users |
| `/roles` | RBAC roles |
| `/permissions` | RBAC permissions |
| `/settings` | Coming soon |
