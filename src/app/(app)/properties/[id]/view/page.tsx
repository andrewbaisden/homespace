"use client";

import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FloorPlanGeometryV1 } from "@/features/floor-plan/domain/geometry";
import { useEditorStore } from "@/features/floor-plan/store";
import { formatGBP } from "@/lib/money";

const PropertyViewer3D = dynamic(
  () =>
    import("@/features/viewer-3d/components/property-viewer-3d").then(
      (m) => m.PropertyViewer3D,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[560px] items-center justify-center rounded-xl border bg-card text-muted-foreground">
        Loading 3D viewer…
      </div>
    ),
  },
);

export default function PropertyViewPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const selectedRoomId = useEditorStore((s) => s.selectedRoomId);
  const setSelectedRoomId = useEditorStore((s) => s.setSelectedRoomId);

  const propertyQuery = useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      const res = await fetch(`/api/properties/${id}`);
      if (!res.ok) throw new Error("Failed to load property");
      return res.json();
    },
  });

  const floorPlanQuery = useQuery({
    queryKey: ["floor-plan", id],
    queryFn: async () => {
      const res = await fetch(`/api/properties/${id}/floor-plan`);
      if (!res.ok) throw new Error("Failed to load floor plan");
      return res.json() as Promise<{ geometry: FloorPlanGeometryV1 }>;
    },
  });

  if (propertyQuery.isLoading || floorPlanQuery.isLoading) {
    return <p className="text-muted-foreground">Loading 3D property…</p>;
  }

  if (!propertyQuery.data || !floorPlanQuery.data) {
    return <p className="text-destructive">Unable to load property view.</p>;
  }

  const rooms = propertyQuery.data.rooms as {
    id: string;
    name: string;
    items: { quantity: number; replacementValuePence: number }[];
  }[];
  const selected = rooms.find((r) => r.id === selectedRoomId);
  const selectedTotal = selected
    ? selected.items.reduce(
        (sum, item) => sum + item.replacementValuePence * item.quantity,
        0,
      )
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">3D property</h1>
          <p className="text-muted-foreground">
            Orbit, zoom, and select rooms to open inventory.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/properties/${id}/floor-plan`}>Edit floor plan</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/properties/${id}/inventory`}>All inventory</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <PropertyViewer3D
          geometry={floorPlanQuery.data.geometry}
          rooms={rooms.map((r) => ({ id: r.id, name: r.name }))}
        />
        <Card>
          <CardHeader>
            <CardTitle>{selected ? selected.name : "Select a room"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selected ? (
              <>
                <p className="text-sm text-muted-foreground">
                  {selected.items.length} line items ·{" "}
                  {formatGBP(selectedTotal)} replacement total
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild>
                    <Link
                      href={`/properties/${id}/inventory?roomId=${selected.id}`}
                    >
                      View inventory
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link
                      href={`/properties/${id}/inventory?roomId=${selected.id}&add=1`}
                    >
                      Add item
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Click a room floor in the 3D scene, or choose a room below.
              </p>
            )}
            <ul className="space-y-2">
              {rooms.map((room) => (
                <li key={room.id}>
                  <button
                    type="button"
                    className="w-full rounded-md border px-3 py-2 text-left text-sm hover:bg-secondary"
                    onClick={() => setSelectedRoomId(room.id)}
                  >
                    {room.name}
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
