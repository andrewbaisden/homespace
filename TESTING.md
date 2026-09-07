# TESTING.md

## Strategy

| Layer | Tool | Focus |
| --- | --- | --- |
| Unit | Vitest | Valuation, money, geometry, scene builder |
| Component | Vitest + RTL | UI primitives and interactions |
| E2E | Playwright | Auth boundaries, dashboard smoke, landing |

## Commands

```bash
pnpm test
pnpm test:watch
pnpm test:e2e
```

E2E expects Postgres migrated + seeded (`pnpm db:seed`). Playwright starts `pnpm dev` automatically.

## Coverage expectations (MVP)

- Domain valuation and geometry transforms must stay covered.
- Critical auth redirect and demo sign-in paths covered by Playwright.
- Prefer focused tests over chasing percentage gates.

## E2E notes

Install browsers once locally:

```bash
pnpm exec playwright install chromium
```

If the Playwright CDN times out, retry later or install from a stable network. CI installs browsers in the workflow.
