"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function DeletePropertyButton({ propertyId }: { propertyId: string }) {
  const router = useRouter();

  async function onDelete() {
    if (!confirm("Delete this property and all related data?")) return;
    const res = await fetch(`/api/properties/${propertyId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("Failed to delete property");
      return;
    }
    toast.success("Property deleted");
    router.push("/properties");
    router.refresh();
  }

  return (
    <Button variant="destructive" onClick={() => void onDelete()}>
      Delete
    </Button>
  );
}
