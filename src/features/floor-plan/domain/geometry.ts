import { z } from "zod";

export const vec2Schema = z.object({
  x: z.number(),
  y: z.number(),
});

export const wallSchema = z.object({
  id: z.string().min(1),
  a: vec2Schema,
  b: vec2Schema,
  thickness: z.number().positive().default(100),
});

export const openingSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["door", "window"]),
  wallId: z.string().min(1),
  /** Position along wall as 0..1 */
  t: z.number().min(0).max(1),
  width: z.number().positive(),
});

export const roomPolygonSchema = z.object({
  roomId: z.string().min(1),
  points: z.array(vec2Schema).min(3),
});

export const floorPlanGeometryV1Schema = z.object({
  version: z.literal(1),
  walls: z.array(wallSchema),
  openings: z.array(openingSchema),
  roomPolygons: z.array(roomPolygonSchema),
});

export type Vec2 = z.infer<typeof vec2Schema>;
export type Wall = z.infer<typeof wallSchema>;
export type Opening = z.infer<typeof openingSchema>;
export type RoomPolygon = z.infer<typeof roomPolygonSchema>;
export type FloorPlanGeometryV1 = z.infer<typeof floorPlanGeometryV1Schema>;

export function emptyGeometry(): FloorPlanGeometryV1 {
  return {
    version: 1,
    walls: [],
    openings: [],
    roomPolygons: [],
  };
}

/** Shoelace formula; input points in mm, returns m² */
export function polygonAreaSqM(points: Vec2[]): number {
  if (points.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    sum += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  const areaMm2 = Math.abs(sum) / 2;
  return areaMm2 / 1_000_000;
}
