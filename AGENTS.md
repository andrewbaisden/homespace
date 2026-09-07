# AGENTS.md

Guidance for AI coding agents working in HomeSpace.

## Architecture rules

- Keep business logic in `src/server/services` and `src/features/*/domain`.
- Never access Prisma from React components.
- Enforce ownership (`property.userId === session.userId`) in services on every read/write by id.
- Floor-plan geometry is a single Zod-validated JSON document. Do not create a second geometry store for 3D.
- Zustand is for UI/editor state only. Server data stays in TanStack Query / server components.
- Money is integer **pence**. Display with `formatGBP`.

## Coding conventions

- TypeScript strict mode
- Feature folders under `src/features`
- Conventional Commits (`feat:`, `fix:`, `test:`, `chore:`, `docs:`, `refactor:`)
- Prefer pnpm scripts from `package.json`

## Commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm db:migrate
pnpm db:seed
```

## Security

- No secrets in logs or commits
- Validate inputs with Zod at API boundaries
- Uploads must remain private by default
- Optimistic cookie checks in `proxy.ts` are UX only; real auth is `requireUser()` / service ownership

## Out of scope (MVP)

Do not implement: full CAD, photogrammetry, Matterport, BIM, arbitrary plan recognition, IoT, multiplayer editing, Redis/BullMQ unless a concrete async job requires it.

## Changing core architecture

Update `ARCHITECTURE.md` and add an ADR in `DECISIONS.md` before changing the geometry model, auth approach, or valuation primary field.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
