# Development

Setup, scripts, and deployment notes for working on HomeSpace. For a product overview, start with the [README](README.md).

## Stack

Next.js 16 App Router · React 19 · TypeScript · Tailwind · shadcn-style UI · Zod · React Hook Form · Zustand · TanStack Query · PostgreSQL · Prisma · Better Auth · Konva · React Three Fiber · Vitest · Playwright · Biome

## Environment variables

Copy [`.env.example`](.env.example) to `.env`.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Auth signing secret |
| `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` | App URL |
| `NEXT_PUBLIC_POSTHOG_*` | Optional product analytics |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Optional error tracking |
| `BLOB_READ_WRITE_TOKEN` | Optional Vercel Blob uploads. Local filesystem is used when this is unset. |

Local Docker Postgres listens on host port **5433**.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start Next.js |
| `pnpm build` / `pnpm start` | Production build and serve |
| `pnpm lint` / `pnpm typecheck` | Quality gates |
| `pnpm test` | Unit and component tests |
| `pnpm test:e2e` | Playwright end-to-end tests |
| `pnpm db:up` / `pnpm db:down` | Start or stop local Docker Postgres |
| `pnpm db:migrate` | Create and apply a local migration (`prisma migrate dev`) |
| `pnpm db:deploy` | Apply existing migrations (`prisma migrate deploy`) |
| `pnpm db:generate` | Generate the Prisma client |
| `pnpm db:seed` | Seed the demo user and sample property |
| `pnpm db:reset` | Reset the local database and reapply migrations |

## Tests

```bash
pnpm test
pnpm test:e2e
```

End-to-end tests expect a migrated and seeded database. Playwright starts the dev server. Install the browser once if needed:

```bash
pnpm exec playwright install chromium
```

See [TESTING.md](TESTING.md) for the test strategy.

## Deployment

Deploy the Next.js app to Vercel and point `DATABASE_URL` at a hosted Postgres instance (for example Neon). Never commit secrets.

On Vercel, set the same variables as `.env.example`, with a strong `BETTER_AUTH_SECRET` and production values for `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL`.

Against an empty database, set `DATABASE_URL` in `.env` to the hosted connection string, then:

```bash
pnpm db:deploy   # apply migrations (prisma migrate deploy)
pnpm db:seed     # demo user and sample property
```

If `db:deploy` fails because the schema is not empty (P3005), or a migration partially failed (P3018, “type already exists”), recover with:

```bash
pnpm exec prisma migrate resolve --rolled-back 20260907124235_init
pnpm exec prisma db push
pnpm exec prisma migrate resolve --applied 20260907124235_init
pnpm db:seed
```

Use `pnpm exec prisma …` or the `pnpm db:*` scripts. Prisma is not installed globally.

## Further reading

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [DECISIONS.md](DECISIONS.md)
- [AGENTS.md](AGENTS.md)
- [AI_ENGINEERING.md](AI_ENGINEERING.md)
