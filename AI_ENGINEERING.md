# AI_ENGINEERING.md

## How HomeSpace was built with AI assistance

### Planning

1. Reviewed an empty repository and locked a production-oriented MVP plan.
2. Chose a hybrid floor-plan model (relational rooms + JSONB geometry) before coding.
3. Sequenced delivery as vertical slices (foundation → property → 2D → 3D → inventory → polish → CI).

### Agent rules

- Follow [`AGENTS.md`](AGENTS.md) for ownership checks, money handling, and out-of-scope constraints.
- Prefer domain-first pure functions that are unit-tested independently of React/Three.js.
- Do not invent CAD/AI recognition features during MVP implementation.

### Human decisions vs generated implementation

| Human decision | AI-assisted implementation |
| --- | --- |
| Better Auth + Prisma | Auth wiring, schema, session helpers |
| Geometry JSON + `buildSceneGraph` | Zod schemas, Konva editor, R3F viewer |
| Replacement-value totals | Valuation helpers + inventory UI |
| Docker on port 5433 | Local Postgres conflict mitigation |
| No Redis in MVP | Sync CSV/print export only |

### Verification process

1. `prisma migrate` + seed against Docker Postgres
2. `vitest` for domain invariants
3. `tsc --noEmit` / Biome for quality
4. Playwright smoke for sign-in and authz redirect
5. Manual walkthrough: dashboard → floor plan → 3D → inventory → export

### Notable debugging

- Host Postgres already bound to `5432`; remapped compose to `5433`.
- pnpm 12 requires explicit/allow-all dependency build scripts for Prisma engines.
- Next.js 16 uses `proxy.ts` for optimistic auth redirects alongside server session checks.

### Prompting pattern used

- Spec → architecture plan → implement by phase → keep docs/ADRs in sync with code.
- Prefer small, testable domain modules over large generated UI dumps.
