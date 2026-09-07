# ARCHITECTURE.md

## Overview

HomeSpace is a Next.js 16 App Router application with PostgreSQL persistence.

```text
UI (App Router + client features)
  → Route handlers / server components
    → Domain services (ownership + validation)
      → Prisma
        → PostgreSQL
```

## Layers

| Layer | Location |
| --- | --- |
| UI routes | `src/app` |
| Feature UI | `src/features/*/components` |
| Domain pure logic | `src/features/*/domain` |
| Client UI state | `src/features/*/store` (Zustand) |
| API | `src/app/api/**` |
| Services | `src/server/services` |
| Auth/session | `src/server/auth.ts`, `src/server/session.ts` |
| DB | `prisma/schema.prisma`, `src/server/db.ts` |

## Floor-plan model

Relational:

- `Property` → `Room` → `InventoryItem`
- `Property` → `FloorPlan` (1:1)

Geometry JSON (`FloorPlan.geometry`):

```ts
{
  version: 1,
  walls: [...],
  openings: [...], // door/window on wall via wallId + t
  roomPolygons: [...] // points linked by roomId
}
```

Validated by Zod (`floorPlanGeometryV1Schema`).

## 2D / 3D relationship

```text
FloorPlan.geometry
        │
        ├── Konva 2D editor
        └── buildSceneGraph() → React Three Fiber viewer
```

Both views derive from the same geometry. Room selection uses `roomId` and Zustand `selectedRoomId`, then loads inventory via TanStack Query / property APIs.

## Valuation

Primary rollup: `replacementValuePence × quantity`.

Purchase and current values are stored for display but do not drive property totals.

## AuthZ

1. `proxy.ts` — cookie presence redirect (optimistic)
2. `(app)/layout` + `requireUser()` — real session
3. Services — property ownership checks

## Background jobs

Not used in MVP. Future AI imports / report generation can add Redis/BullMQ without changing the core domain model.
