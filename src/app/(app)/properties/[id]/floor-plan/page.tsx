"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FloorPlanEditor } from "@/features/floor-plan/components/floor-plan-editor";
import type { FloorPlanGeometryV1 } from "@/features/floor-plan/domain/geometry";

export default function FloorPlanPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();

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

  const saveMutation = useMutation({
    mutationFn: async (geometry: FloorPlanGeometryV1) => {
      const res = await fetch(`/api/properties/${id}/floor-plan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geometry }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save floor plan");
      }
      return res.json();
    },
    onSuccess: async () => {
      toast.success("Floor plan saved");
      await queryClient.invalidateQueries({ queryKey: ["floor-plan", id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (propertyQuery.isLoading || floorPlanQuery.isLoading) {
    return <p className="text-muted-foreground">Loading floor plan…</p>;
  }

  if (propertyQuery.error || floorPlanQuery.error || !floorPlanQuery.data) {
    return <p className="text-destructive">Unable to load floor plan.</p>;
  }

  const rooms =
    (propertyQuery.data.rooms as { id: string; name: string }[]) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Floor plan</h1>
          <p className="text-muted-foreground">
            Desktop-first editor. Create rooms on the property page first, then
            outline them here.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/properties/${id}`}>Back</Link>
          </Button>
          <Button asChild>
            <Link href={`/properties/${id}/view`}>Open 3D</Link>
          </Button>
        </div>
      </div>

      <div className="hidden md:block">
        <FloorPlanEditor
          geometry={floorPlanQuery.data.geometry}
          rooms={rooms}
          saving={saveMutation.isPending}
          onSave={async (geometry) => {
            await saveMutation.mutateAsync(geometry);
          }}
        />
      </div>
      <div className="rounded-xl border bg-card p-6 md:hidden">
        <p className="text-sm text-muted-foreground">
          Floor-plan editing is best on a larger screen. You can still view the
          3D model and manage inventory on mobile.
        </p>
      </div>
    </div>
  );
}
