"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ROOM_TYPES = [
  "LIVING_ROOM",
  "KITCHEN",
  "DINING_ROOM",
  "BEDROOM",
  "BATHROOM",
  "OFFICE",
  "GARAGE",
  "HALLWAY",
  "OTHER",
] as const;

export function AddRoomForm({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<(typeof ROOM_TYPES)[number]>("OTHER");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await fetch(`/api/properties/${propertyId}/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type }),
    });
    setPending(false);
    if (!res.ok) {
      toast.error("Failed to add room");
      return;
    }
    toast.success("Room added");
    setName("");
    router.refresh();
  }

  return (
    <form className="space-y-2" onSubmit={onSubmit}>
      <Input
        placeholder="Room name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <select
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={type}
        onChange={(e) => setType(e.target.value as (typeof ROOM_TYPES)[number])}
        aria-label="Room type"
      >
        {ROOM_TYPES.map((t) => (
          <option key={t} value={t}>
            {t.replaceAll("_", " ")}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" disabled={pending || !name.trim()}>
        {pending ? "Adding…" : "Add room"}
      </Button>
    </form>
  );
}
