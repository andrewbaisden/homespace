import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddRoomForm } from "@/features/properties/components/add-room-form";
import { DeletePropertyButton } from "@/features/properties/components/delete-property-button";
import { formatGBP } from "@/lib/money";
import { getProperty } from "@/server/services/property-service";
import { requireUser } from "@/server/session";

type Params = { params: Promise<{ id: string }> };

export default async function PropertyDetailPage({ params }: Params) {
  const user = await requireUser();
  const { id } = await params;

  let property: Awaited<ReturnType<typeof getProperty>>;
  try {
    property = await getProperty(user.id, id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">{property.name}</h1>
          <p className="text-muted-foreground">
            {property.address ?? "No address"} · {property.rooms.length} rooms ·{" "}
            {formatGBP(property.inventoryValuePence)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/properties/${id}/floor-plan`}>Floor plan</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/properties/${id}/view`}>3D view</Link>
          </Button>
          <Button asChild>
            <Link href={`/properties/${id}/inventory`}>Inventory</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/properties/${id}/export`}>Export</Link>
          </Button>
          <DeletePropertyButton propertyId={id} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Room inventory values</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {property.roomTotals.map((room) => (
                <li
                  key={room.roomId}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{room.roomName}</p>
                    <p className="text-muted-foreground">
                      {room.itemCount} items
                    </p>
                  </div>
                  <p>{formatGBP(room.totalPence)}</p>
                </li>
              ))}
              {property.roomTotals.length === 0 ? (
                <li className="py-4 text-sm text-muted-foreground">
                  Add rooms, then inventory, to see totals.
                </li>
              ) : null}
            </ul>
            <div className="mt-4 flex justify-between border-t pt-4 font-semibold">
              <span>Property total</span>
              <span>{formatGBP(property.inventoryValuePence)}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Totals use replacement value × quantity. Estimates are not
              guaranteed market values.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rooms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {property.rooms.map((room) => (
                <li
                  key={room.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <span>{room.name}</span>
                  <Badge>{room.type.replaceAll("_", " ")}</Badge>
                </li>
              ))}
            </ul>
            <AddRoomForm propertyId={id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
