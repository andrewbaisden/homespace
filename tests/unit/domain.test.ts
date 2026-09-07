import { describe, expect, it } from "vitest";
import {
  emptyGeometry,
  floorPlanGeometryV1Schema,
  polygonAreaSqM,
} from "@/features/floor-plan/domain/geometry";
import { buildSceneGraph } from "@/features/floor-plan/domain/scene-builder";
import {
  itemReplacementTotalPence,
  propertyTotalPence,
  roomTotals,
  sumReplacementPence,
} from "@/features/inventory/domain/valuation";
import { formatGBP, poundsToPence } from "@/lib/money";

describe("valuation", () => {
  it("multiplies replacement value by quantity", () => {
    expect(
      itemReplacementTotalPence({
        quantity: 2,
        replacementValuePence: 5000,
      }),
    ).toBe(10000);
  });

  it("sums room and property totals", () => {
    const rooms = roomTotals([
      {
        id: "r1",
        name: "Living Room",
        items: [
          { quantity: 1, replacementValuePence: 120000 },
          { quantity: 1, replacementValuePence: 85000 },
        ],
      },
      {
        id: "r2",
        name: "Kitchen",
        items: [{ quantity: 4, replacementValuePence: 8000 }],
      },
    ]);
    expect(rooms[0].totalPence).toBe(205000);
    expect(rooms[1].totalPence).toBe(32000);
    expect(propertyTotalPence(rooms)).toBe(237000);
    expect(
      sumReplacementPence([
        { quantity: 1, replacementValuePence: 120000 },
        { quantity: 1, replacementValuePence: 85000 },
      ]),
    ).toBe(205000);
  });
});

describe("money", () => {
  it("converts pounds to pence without float drift for common values", () => {
    expect(poundsToPence(12.34)).toBe(1234);
    expect(formatGBP(1234)).toContain("12.34");
  });
});

describe("geometry", () => {
  it("validates empty geometry", () => {
    expect(floorPlanGeometryV1Schema.parse(emptyGeometry()).version).toBe(1);
  });

  it("calculates polygon area in square metres", () => {
    const area = polygonAreaSqM([
      { x: 0, y: 0 },
      { x: 1000, y: 0 },
      { x: 1000, y: 1000 },
      { x: 0, y: 1000 },
    ]);
    expect(area).toBeCloseTo(1, 5);
  });

  it("builds a deterministic scene graph", () => {
    const geometry = floorPlanGeometryV1Schema.parse({
      version: 1,
      walls: [
        {
          id: "w1",
          a: { x: 0, y: 0 },
          b: { x: 4000, y: 0 },
          thickness: 100,
        },
      ],
      openings: [{ id: "d1", kind: "door", wallId: "w1", t: 0.5, width: 900 }],
      roomPolygons: [
        {
          roomId: "room-1",
          points: [
            { x: 0, y: 0 },
            { x: 4000, y: 0 },
            { x: 4000, y: 3000 },
            { x: 0, y: 3000 },
          ],
        },
      ],
    });
    const scene = buildSceneGraph(geometry, [{ id: "room-1", name: "Office" }]);
    expect(scene.walls).toHaveLength(1);
    expect(scene.floors).toHaveLength(1);
    expect(scene.openings).toHaveLength(1);
    expect(scene.openings[0].rotationY).toBeCloseTo(0, 5);
    expect(scene.openings[0].size[0]).toBeCloseTo(0.9, 5);
    expect(scene.labels[0].name).toBe("Office");
    expect(scene.selectableRoomIds).toEqual(["room-1"]);
  });
});
