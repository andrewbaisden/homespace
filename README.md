# HomeSpace

Create or import a clean 2D floor plan, explore an interactive 3D dollhouse, and manage room inventory with replacement-value totals.

![HomeSpace 3D property viewer](docs/homespace.png)

## Features

- Email/password authentication (Better Auth)
- Property and room management
- Orthogonal 2D floor-plan editor (walls, doors, windows, room areas)
- JSON floor-plan import/export
- Interactive 3D property viewer with room selection
- Inventory CRUD, search/filters, and valuation totals
- CSV + printable insurance-style inventory report
- Demo seed property: **12 Example Road**
- Vitest, Playwright, Biome, GitHub Actions
- Sentry + PostHog hooks (optional via env)

## Stack

Next.js 16 App Router · React · TypeScript · Tailwind · shadcn-style UI · Zod · React Hook Form · Zustand · TanStack Query · PostgreSQL · Prisma · Better Auth · Konva · React Three Fiber · Vitest · Playwright · Biome

## Setup

```bash
pnpm install
cp .env.example .env
pnpm db:up
pnpm db:migrate
pnpm db:generate
pnpm db:seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo credentials

- Email: `demo@homespace.app`
- Password: `demopassword`

> Local Docker Postgres is mapped to **host port 5433** to avoid clashes with a system Postgres on 5432.

## Environment variables

See [`.env.example`](.env.example).

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Auth signing secret |
| `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` | App URL |
| `NEXT_PUBLIC_POSTHOG_*` | Optional product analytics |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Optional error tracking |
| `BLOB_READ_WRITE_TOKEN` | Optional Vercel Blob uploads |

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start Next.js |
| `pnpm build` / `pnpm start` | Production build/serve |
| `pnpm lint` / `pnpm typecheck` | Quality gates |
| `pnpm test` | Unit + component tests |
| `pnpm test:e2e` | Playwright E2E |
| `pnpm db:up` / `pnpm db:migrate` / `pnpm db:seed` | Database |

## Deployment

Deploy the Next.js app to Vercel and point `DATABASE_URL` at a hosted Postgres instance. Run migrations in CI or a release step (`prisma migrate deploy`). Never commit secrets.

## Docs

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [DECISIONS.md](DECISIONS.md)
- [TESTING.md](TESTING.md)
- [AGENTS.md](AGENTS.md)
- [AI_ENGINEERING.md](AI_ENGINEERING.md)
