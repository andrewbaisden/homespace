"use client";

import type Konva from "konva";
import { nanoid } from "nanoid";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Circle, Group, Layer, Line, Rect, Stage, Text } from "react-konva";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  FloorPlanGeometryV1,
  Vec2,
} from "@/features/floor-plan/domain/geometry";
import { type EditorMode, useEditorStore } from "@/features/floor-plan/store";

const SNAP = 250; // mm
const SCALE = 0.05; // px per mm

function snap(n: number) {
  return Math.round(n / SNAP) * SNAP;
}

function toWorld(pointer: Vec2): Vec2 {
  return { x: snap(pointer.x / SCALE), y: snap(pointer.y / SCALE) };
}

function orthoEnd(start: Vec2, end: Vec2): Vec2 {
  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);
  if (dx >= dy) return { x: end.x, y: start.y };
  return { x: start.x, y: end.y };
}

type RoomOption = { id: string; name: string };

export function FloorPlanEditor({
  geometry,
  rooms,
  onSave,
  saving,
}: {
  geometry: FloorPlanGeometryV1;
  rooms: RoomOption[];
  onSave: (geometry: FloorPlanGeometryV1) => Promise<void>;
  saving?: boolean;
}) {
  const {
    editorMode,
    setEditorMode,
    draftGeometry,
    setDraftGeometry,
    isDirty,
    selectedRoomId,
    setSelectedRoomId,
    markClean,
  } = useEditorStore();

  const [wallStart, setWallStart] = useState<Vec2 | null>(null);
  const [cursor, setCursor] = useState<Vec2 | null>(null);
  const [polygonDraft, setPolygonDraft] = useState<Vec2[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 560 });

  useEffect(() => {
    setDraftGeometry(structuredClone(geometry), false);
  }, [geometry, setDraftGeometry]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setSize({
        width: el.clientWidth,
        height: Math.max(480, el.clientHeight),
      });
    });
    observer.observe(el);
    setSize({ width: el.clientWidth, height: Math.max(480, el.clientHeight) });
    return () => observer.disconnect();
  }, []);

  const g = draftGeometry ?? geometry;

  const getPointer = useCallback((stage: Konva.Stage) => {
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    return toWorld(pos);
  }, []);

  const update = useCallback(
    (next: FloorPlanGeometryV1) => setDraftGeometry(next, true),
    [setDraftGeometry],
  );

  function handleStageClick(e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = e.target.getStage();
    if (!stage) return;
    const world = getPointer(stage);
    if (!world) return;

    if (editorMode === "wall") {
      if (!wallStart) {
        setWallStart(world);
        return;
      }
      const end = orthoEnd(wallStart, world);
      if (end.x === wallStart.x && end.y === wallStart.y) return;
      update({
        ...g,
        walls: [
          ...g.walls,
          {
            id: nanoid(),
            a: wallStart,
            b: end,
            thickness: 100,
          },
        ],
      });
      setWallStart(null);
      return;
    }

    if (editorMode === "room-polygon") {
      if (!selectedRoomId) return;
      setPolygonDraft((prev) => [...prev, world]);
      return;
    }

    if (editorMode === "select" && e.target === stage) {
      setSelectedId(null);
    }
  }

  function placeOpening(kind: "door" | "window", wallId: string, t: number) {
    update({
      ...g,
      openings: [
        ...g.openings,
        {
          id: nanoid(),
          kind,
          wallId,
          t,
          width: kind === "door" ? 900 : 1200,
        },
      ],
    });
  }

  function finishPolygon() {
    if (!selectedRoomId || polygonDraft.length < 3) return;
    const others = g.roomPolygons.filter((p) => p.roomId !== selectedRoomId);
    update({
      ...g,
      roomPolygons: [
        ...others,
        { roomId: selectedRoomId, points: polygonDraft },
      ],
    });
    setPolygonDraft([]);
  }

  function deleteSelected() {
    if (!selectedId) return;
    update({
      ...g,
      walls: g.walls.filter((w) => w.id !== selectedId),
      openings: g.openings.filter(
        (o) => o.id !== selectedId && o.wallId !== selectedId,
      ),
      roomPolygons: g.roomPolygons.filter(
        (p) => `poly-${p.roomId}` !== selectedId,
      ),
    });
    setSelectedId(null);
  }

  async function save() {
    await onSave(g);
    markClean();
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(g, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "floor-plan.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importJson(file: File) {
    const text = await file.text();
    const parsed = JSON.parse(text) as FloorPlanGeometryV1;
    setDraftGeometry(parsed, true);
  }

  const modes: { id: EditorMode; label: string }[] = [
    { id: "select", label: "Select" },
    { id: "wall", label: "Wall" },
    { id: "door", label: "Door" },
    { id: "window", label: "Window" },
    { id: "room-polygon", label: "Room area" },
  ];

  const roomLabels = useMemo(() => {
    const map = new Map(rooms.map((r) => [r.id, r.name]));
    return g.roomPolygons.map((poly) => {
      const cx = poly.points.reduce((s, p) => s + p.x, 0) / poly.points.length;
      const cy = poly.points.reduce((s, p) => s + p.y, 0) / poly.points.length;
      return {
        roomId: poly.roomId,
        name: map.get(poly.roomId) ?? "Room",
        x: cx * SCALE,
        y: cy * SCALE,
      };
    });
  }, [g.roomPolygons, rooms]);

  return (
    <div className="flex h-full min-h-[560px] flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {modes.map((mode) => (
          <Button
            key={mode.id}
            size="sm"
            variant={editorMode === mode.id ? "default" : "outline"}
            onClick={() => {
              setEditorMode(mode.id);
              setWallStart(null);
              setPolygonDraft([]);
            }}
          >
            {mode.label}
          </Button>
        ))}
        <Button
          size="sm"
          variant="outline"
          onClick={deleteSelected}
          disabled={!selectedId}
        >
          Delete
        </Button>
        {editorMode === "room-polygon" ? (
          <>
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={selectedRoomId ?? ""}
              onChange={(e) => setSelectedRoomId(e.target.value || null)}
              aria-label="Room for polygon"
            >
              <option value="">Select room…</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="secondary"
              onClick={finishPolygon}
              disabled={polygonDraft.length < 3}
            >
              Finish area
            </Button>
          </>
        ) : null}
        <div className="ml-auto flex items-center gap-2">
          {isDirty ? <Badge>Unsaved</Badge> : null}
          <label className="inline-flex h-9 cursor-pointer items-center rounded-md border border-input px-3 text-sm">
            Import JSON
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importJson(file);
              }}
            />
          </label>
          <Button size="sm" variant="outline" onClick={exportJson}>
            Export JSON
          </Button>
          <Button
            size="sm"
            onClick={() => void save()}
            disabled={saving || !isDirty}
          >
            {saving ? "Saving…" : "Save plan"}
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Orthogonal walls snap to a 250mm grid. Draw walls, place doors/windows
        on walls, then outline room areas linked to a room.
      </p>

      <div
        ref={containerRef}
        className="relative min-h-[480px] flex-1 overflow-hidden rounded-xl border border-border bg-[linear-gradient(180deg,#f7f4ef_0%,#efe8dc_100%)]"
      >
        <Stage
          width={size.width}
          height={size.height}
          onMouseMove={(e) => {
            const stage = e.target.getStage();
            if (!stage) return;
            const world = getPointer(stage);
            setCursor(world);
          }}
          onClick={handleStageClick}
        >
          <Layer>
            {Array.from({ length: 40 }).map((_, i) => (
              <Line
                key={`vg-${i}`}
                points={[i * SNAP * SCALE, 0, i * SNAP * SCALE, size.height]}
                stroke="#d9d0c2"
                strokeWidth={1}
              />
            ))}
            {Array.from({ length: 30 }).map((_, i) => (
              <Line
                key={`hg-${i}`}
                points={[0, i * SNAP * SCALE, size.width, i * SNAP * SCALE]}
                stroke="#d9d0c2"
                strokeWidth={1}
              />
            ))}

            {g.roomPolygons.map((poly) => (
              <Line
                key={`poly-${poly.roomId}`}
                points={poly.points.flatMap((p) => [p.x * SCALE, p.y * SCALE])}
                closed
                fill={
                  selectedRoomId === poly.roomId
                    ? "rgba(61, 90, 74, 0.28)"
                    : "rgba(61, 90, 74, 0.14)"
                }
                stroke="#3d5a4a"
                strokeWidth={selectedId === `poly-${poly.roomId}` ? 3 : 1}
                onClick={(e) => {
                  e.cancelBubble = true;
                  setSelectedId(`poly-${poly.roomId}`);
                  setSelectedRoomId(poly.roomId);
                }}
              />
            ))}

            {g.walls.map((wall) => {
              const points = [
                wall.a.x * SCALE,
                wall.a.y * SCALE,
                wall.b.x * SCALE,
                wall.b.y * SCALE,
              ];
              return (
                <Group key={wall.id}>
                  <Line
                    points={points}
                    stroke={selectedId === wall.id ? "#1f2a24" : "#2c3a33"}
                    strokeWidth={selectedId === wall.id ? 8 : 6}
                    lineCap="round"
                    onClick={(e) => {
                      e.cancelBubble = true;
                      if (editorMode === "door" || editorMode === "window") {
                        const stage = e.target.getStage();
                        const world = stage ? getPointer(stage) : null;
                        if (!world) return;
                        const dx = wall.b.x - wall.a.x;
                        const dy = wall.b.y - wall.a.y;
                        const len2 = dx * dx + dy * dy || 1;
                        const t = Math.max(
                          0.1,
                          Math.min(
                            0.9,
                            ((world.x - wall.a.x) * dx +
                              (world.y - wall.a.y) * dy) /
                              len2,
                          ),
                        );
                        placeOpening(editorMode, wall.id, t);
                        return;
                      }
                      setSelectedId(wall.id);
                    }}
                  />
                </Group>
              );
            })}

            {g.openings.map((opening) => {
              const wall = g.walls.find((w) => w.id === opening.wallId);
              if (!wall) return null;
              const x = (wall.a.x + (wall.b.x - wall.a.x) * opening.t) * SCALE;
              const y = (wall.a.y + (wall.b.y - wall.a.y) * opening.t) * SCALE;
              return (
                <Rect
                  key={opening.id}
                  x={x - 8}
                  y={y - 8}
                  width={16}
                  height={16}
                  fill={opening.kind === "door" ? "#8b5a2b" : "#5b7c99"}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    setSelectedId(opening.id);
                  }}
                />
              );
            })}

            {roomLabels.map((label) => (
              <Text
                key={`label-${label.roomId}`}
                x={label.x - 30}
                y={label.y - 8}
                text={label.name}
                fontSize={14}
                fill="#1f2a24"
                fontFamily="Fraunces, Georgia, serif"
              />
            ))}

            {polygonDraft.length > 0 ? (
              <Line
                points={polygonDraft.flatMap((p) => [p.x * SCALE, p.y * SCALE])}
                stroke="#3d5a4a"
                dash={[6, 4]}
                strokeWidth={2}
              />
            ) : null}

            {wallStart && cursor ? (
              <Line
                points={[
                  wallStart.x * SCALE,
                  wallStart.y * SCALE,
                  orthoEnd(wallStart, cursor).x * SCALE,
                  orthoEnd(wallStart, cursor).y * SCALE,
                ]}
                stroke="#3d5a4a"
                dash={[8, 6]}
                strokeWidth={4}
              />
            ) : null}

            {cursor ? (
              <Circle
                x={cursor.x * SCALE}
                y={cursor.y * SCALE}
                radius={4}
                fill="#3d5a4a"
              />
            ) : null}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
