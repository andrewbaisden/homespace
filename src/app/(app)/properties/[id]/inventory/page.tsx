"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEditorStore } from "@/features/floor-plan/store";
import { formatGBP, poundsToPence } from "@/lib/money";

const CATEGORIES = [
  "FURNITURE",
  "ELECTRONICS",
  "APPLIANCES",
  "CLOTHING",
  "JEWELRY",
  "ART",
  "TOOLS",
  "SPORTS",
  "BOOKS",
  "KITCHENWARE",
  "OTHER",
] as const;

const CONDITIONS = ["NEW", "EXCELLENT", "GOOD", "FAIR", "POOR"] as const;

function InventoryPageInner() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = params.id;
  const queryClient = useQueryClient();
  const setSelectedRoomId = useEditorStore((s) => s.setSelectedRoomId);

  const [q, setQ] = useState("");
  const [roomId, setRoomId] = useState(searchParams.get("roomId") ?? "");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [showForm, setShowForm] = useState(searchParams.get("add") === "1");

  const [form, setForm] = useState({
    name: "",
    category: "OTHER",
    quantity: 1,
    replacementValue: "",
    currentValue: "",
    purchasePrice: "",
    condition: "GOOD",
    notes: "",
    serialNumber: "",
    roomId: searchParams.get("roomId") ?? "",
  });

  const propertyQuery = useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      const res = await fetch(`/api/properties/${id}`);
      if (!res.ok) throw new Error("Failed to load property");
      return res.json();
    },
  });

  const filterKey = useMemo(
    () => ({ q, roomId, category, condition }),
    [q, roomId, category, condition],
  );

  const inventoryQuery = useQuery({
    queryKey: ["inventory", id, filterKey],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (q) qs.set("q", q);
      if (roomId) qs.set("roomId", roomId);
      if (category) qs.set("category", category);
      if (condition) qs.set("condition", condition);
      const res = await fetch(`/api/properties/${id}/inventory?${qs}`);
      if (!res.ok) throw new Error("Failed to load inventory");
      return res.json() as Promise<{
        items: Array<{
          id: string;
          name: string;
          category: string;
          quantity: number;
          condition: string;
          replacementValuePence: number;
          room: { id: string; name: string };
        }>;
        totalReplacementPence: number;
      }>;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.roomId) throw new Error("Choose a room");
      const res = await fetch(`/api/rooms/${form.roomId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          quantity: Number(form.quantity),
          condition: form.condition,
          notes: form.notes || null,
          serialNumber: form.serialNumber || null,
          replacementValuePence: poundsToPence(
            Number(form.replacementValue || 0),
          ),
          currentValuePence: form.currentValue
            ? poundsToPence(Number(form.currentValue))
            : null,
          purchasePricePence: form.purchasePrice
            ? poundsToPence(Number(form.purchasePrice))
            : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to add item");
      }
      return res.json();
    },
    onSuccess: async () => {
      toast.success("Item added");
      setShowForm(false);
      setForm((f) => ({
        ...f,
        name: "",
        notes: "",
        serialNumber: "",
        replacementValue: "",
      }));
      await queryClient.invalidateQueries({ queryKey: ["inventory", id] });
      await queryClient.invalidateQueries({ queryKey: ["property", id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`/api/items/${itemId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete item");
    },
    onSuccess: async () => {
      toast.success("Item deleted");
      await queryClient.invalidateQueries({ queryKey: ["inventory", id] });
      await queryClient.invalidateQueries({ queryKey: ["property", id] });
    },
  });

  const rooms =
    (propertyQuery.data?.rooms as { id: string; name: string }[]) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Inventory</h1>
          <p className="text-muted-foreground">
            Search and manage items. Replacement value drives room and property
            totals.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/properties/${id}/view`}>Focus in 3D</Link>
          </Button>
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Close form" : "Add item"}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-3 pt-6 md:grid-cols-4">
          <Input
            placeholder="Search items…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search inventory"
          />
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={roomId}
            onChange={(e) => {
              setRoomId(e.target.value);
              setSelectedRoomId(e.target.value || null);
            }}
            aria-label="Filter by room"
          >
            <option value="">All rooms</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            aria-label="Filter by condition"
          >
            <option value="">All conditions</option>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Add inventory item</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-3 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
            >
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="item-name">Name</Label>
                <Input
                  id="item-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-room">Room</Label>
                <select
                  id="item-room"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.roomId}
                  onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                  required
                >
                  <option value="">Select room…</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-category">Category</Label>
                <select
                  id="item-category"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="qty">Quantity</Label>
                <Input
                  id="qty"
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="replacement">Replacement value (£)</Label>
                <Input
                  id="replacement"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.replacementValue}
                  onChange={(e) =>
                    setForm({ ...form, replacementValue: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current">Current value (£)</Label>
                <Input
                  id="current"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.currentValue}
                  onChange={(e) =>
                    setForm({ ...form, currentValue: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase">Purchase price (£)</Label>
                <Input
                  id="purchase"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.purchasePrice}
                  onChange={(e) =>
                    setForm({ ...form, purchasePrice: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving…" : "Save item"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Items</CardTitle>
          <p className="text-sm text-muted-foreground">
            Filtered total:{" "}
            {formatGBP(inventoryQuery.data?.totalReplacementPence ?? 0)}
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Item</th>
                  <th className="py-2 pr-3 font-medium">Room</th>
                  <th className="py-2 pr-3 font-medium">Qty</th>
                  <th className="py-2 pr-3 font-medium">Replacement</th>
                  <th className="py-2 pr-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventoryQuery.data?.items.map((item) => (
                  <tr key={item.id} className="border-b border-border/70">
                    <td className="py-3 pr-3">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.category} · {item.condition}
                      </p>
                    </td>
                    <td className="py-3 pr-3">{item.room.name}</td>
                    <td className="py-3 pr-3">{item.quantity}</td>
                    <td className="py-3 pr-3">
                      {formatGBP(item.replacementValuePence * item.quantity)}
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link
                            href={`/properties/${id}/view`}
                            onClick={() => setSelectedRoomId(item.room.id)}
                          >
                            Focus 3D
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(item.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {inventoryQuery.data?.items.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground">
                No items match.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense
      fallback={<p className="text-muted-foreground">Loading inventory…</p>}
    >
      <InventoryPageInner />
    </Suspense>
  );
}
