import type { FloorPlanGeometryV1, Vec2 } from "./geometry";

export type SceneRoomLabel = {
  roomId: string;
  name: string;
  position: [number, number, number];
};

export type SceneWallMesh = {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
  rotationY: number;
};

export type SceneFloorMesh = {
  roomId: string;
  points: [number, number][];
};

export type SceneOpeningMarker = {
  id: string;
  kind: "door" | "window";
  position: [number, number, number];
  /** Box size: width along wall, height, depth through wall */
  size: [number, number, number];
  rotationY: number;
};

export type SceneGraph = {
  walls: SceneWallMesh[];
  floors: SceneFloorMesh[];
  openings: SceneOpeningMarker[];
  labels: SceneRoomLabel[];
  selectableRoomIds: string[];
  /** Scene extents for camera framing (metres) */
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
};

const WALL_HEIGHT_M = 2.7;
const MM_TO_M = 0.001;

function mmToM(v: number) {
  return v * MM_TO_M;
}

function centroid(points: Vec2[]): Vec2 {
  const n = points.length || 1;
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), {
    x: 0,
    y: 0,
  });
  return { x: sum.x / n, y: sum.y / n };
}

export type RoomMeta = { id: string; name: string };

/**
 * Deterministically convert floor-plan geometry (mm, top-down X/Y)
 * into a 3D scene graph in metres (X/Z ground plane, Y up).
 */
export function buildSceneGraph(
  geometry: FloorPlanGeometryV1,
  rooms: RoomMeta[],
): SceneGraph {
  const roomNameById = new Map(rooms.map((r) => [r.id, r.name]));

  const walls: SceneWallMesh[] = geometry.walls.map((wall) => {
    const ax = mmToM(wall.a.x);
    const az = mmToM(wall.a.y);
    const bx = mmToM(wall.b.x);
    const bz = mmToM(wall.b.y);
    const dx = bx - ax;
    const dz = bz - az;
    const length = Math.hypot(dx, dz) || 0.01;
    const thickness = mmToM(wall.thickness);
    const midX = (ax + bx) / 2;
    const midZ = (az + bz) / 2;
    const rotationY = -Math.atan2(dz, dx);
    return {
      id: wall.id,
      position: [midX, WALL_HEIGHT_M / 2, midZ],
      size: [length, WALL_HEIGHT_M, thickness],
      rotationY,
    };
  });

  const floors: SceneFloorMesh[] = geometry.roomPolygons.map((poly) => ({
    roomId: poly.roomId,
    points: poly.points.map(
      (p) => [mmToM(p.x), mmToM(p.y)] as [number, number],
    ),
  }));

  const openings: SceneOpeningMarker[] = geometry.openings.flatMap(
    (opening) => {
      const wall = geometry.walls.find((w) => w.id === opening.wallId);
      if (!wall) return [];
      const ax = mmToM(wall.a.x);
      const az = mmToM(wall.a.y);
      const bx = mmToM(wall.b.x);
      const bz = mmToM(wall.b.y);
      const dx = bx - ax;
      const dz = bz - az;
      const x = ax + dx * opening.t;
      const z = az + dz * opening.t;
      const rotationY = -Math.atan2(dz, dx);
      const height = opening.kind === "door" ? 2.1 : 1.2;
      const depth = Math.max(mmToM(wall.thickness) * 1.15, 0.12);
      return [
        {
          id: opening.id,
          kind: opening.kind,
          position: [x, opening.kind === "door" ? height / 2 : 1.5, z],
          size: [mmToM(opening.width), height, depth],
          rotationY,
        },
      ];
    },
  );

  const labels: SceneRoomLabel[] = geometry.roomPolygons.map((poly) => {
    const c = centroid(poly.points);
    return {
      roomId: poly.roomId,
      name: roomNameById.get(poly.roomId) ?? "Room",
      position: [mmToM(c.x), 0.05, mmToM(c.y)],
    };
  });

  let minX = 0;
  let maxX = 10;
  let minZ = 0;
  let maxZ = 10;
  const allPoints = [
    ...geometry.walls.flatMap((w) => [w.a, w.b]),
    ...geometry.roomPolygons.flatMap((p) => p.points),
  ];
  if (allPoints.length > 0) {
    minX = Math.min(...allPoints.map((p) => mmToM(p.x)));
    maxX = Math.max(...allPoints.map((p) => mmToM(p.x)));
    minZ = Math.min(...allPoints.map((p) => mmToM(p.y)));
    maxZ = Math.max(...allPoints.map((p) => mmToM(p.y)));
  }

  return {
    walls,
    floors,
    openings,
    labels,
    selectableRoomIds: geometry.roomPolygons.map((p) => p.roomId),
    bounds: { minX, maxX, minZ, maxZ },
  };
}
