# Workspace

## Overview

GigShield - Parametric insurance platform for gig workers (delivery partners). Provides automatic payouts when weather events, platform outages, or other disruptions affect gig earnings. Zero-touch claims: "No forms, no claims, no delays."

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, Tailwind CSS, shadcn/ui, Recharts, framer-motion

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── gigshield/          # React + Vite frontend (GigShield app at /)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Database Schema

- **workers**: User accounts (gig workers + admins), trust/risk scores
- **policies**: Insurance subscriptions (basic/standard/premium plans)
- **triggers**: Disruption events (rain, heat, platform_outage, etc.)
- **claims**: Auto-generated payouts when triggers fire in a worker's zone

## Key Features

- **Landing page** with hero, coverage benefits, how-it-works, pricing plans
- **Worker registration** (multi-step: profile → platform/zone → plan)
- **Worker dashboard**: Coverage status, real-time trigger alerts, claim history, stats
- **Claims history**: Filter by status, view trigger details and payout amounts
- **Plans page**: Compare Basic/Standard/Premium tiers, subscribe
- **Profile page**: Edit zone, platform, contact info
- **Admin portal** (role-protected):
  - Overview: Stats cards + recent activity feed
  - Workers: Table with trust/risk scores
  - Claims: Table with fraud scores, approve/reject/mark-paid
  - Triggers: List + "Simulate Event" form for testing
- **Static pages**: About (parametric insurance explained), FAQ

## API Routes

- `POST /api/auth/register` - Register new worker
- `POST /api/auth/login` - Login, returns JWT
- `GET /api/auth/me` - Get current user
- `GET /api/workers/:id/dashboard` - Worker dashboard data
- `GET /api/workers/:id/policies` - Worker policies
- `POST /api/policies` - Subscribe to plan
- `GET /api/policies` - List available plans
- `GET /api/claims?workerId=X` - Worker claims
- `POST /api/triggers` - Fire a trigger event (auto-creates claims)
- `GET /api/admin/*` - Admin-only endpoints

## Demo Accounts

- **Admin**: admin@gigshield.com / admin123
- **Worker 1**: ravi@worker.com / worker123 (Standard Shield, Koramangala)
- **Worker 2**: priya@worker.com / worker123 (Premium Shield, Indiranagar)
- **Worker 3**: arjun@worker.com / worker123 (Basic Shield, HSR Layout)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references
