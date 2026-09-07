# DECISIONS.md

## ADR-001 — Structured floor-plan domain model

**Decision:** Represent floor plans as versioned structured geometry (walls, openings, room polygons), not as images.

**Why:** Enables deterministic 3D generation, validation, import/export, and future AI pipelines that emit the same schema.

## ADR-002 — 3D scene derives from floor-plan geometry

**Decision:** `buildSceneGraph(geometry, rooms)` is the only bridge to 3D.

**Why:** Prevents 2D/3D drift and keeps Three.js as a presentation layer.

## ADR-003 — Zustand limited to client/UI state

**Decision:** Selected room, editor mode, draft geometry, and view mode live in Zustand. Properties/inventory live in TanStack Query / server components.

**Why:** Avoid duplicating server state and stale cache bugs.

## ADR-004 — PostgreSQL + Prisma

**Decision:** Persist users, properties, rooms, inventory relationally; store floor-plan geometry as JSONB.

**Why:** Strong ownership/query integrity for inventory reporting; flexible editing for geometry graphs.

## ADR-005 — No arbitrary floor-plan image recognition in MVP

**Decision:** MVP supports JSON import/export and manual editing only.

**Why:** Recognition quality and scope risk are too high for a reliable first release. Schema leaves an extension point for later AI ingestion.

## ADR-006 — Replacement value is the primary total

**Decision:** Room/property totals use replacement value × quantity.

**Why:** Aligns with insurance inventory reporting; estimates remain clearly labelled.

## ADR-007 — Better Auth over Clerk

**Decision:** Self-hosted Better Auth with Prisma adapter and email/password.

**Why:** Matches portfolio/full-stack ownership goals and integrates cleanly with the app database.

## ADR-008 — Redis/BullMQ deferred

**Decision:** No Redis in MVP.

**Why:** Exports and floor-plan saves are synchronous; avoid infrastructure without a justifying workload.
