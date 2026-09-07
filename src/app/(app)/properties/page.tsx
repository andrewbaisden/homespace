import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatGBP } from "@/lib/money";
import { listProperties } from "@/server/services/property-service";
import { requireUser } from "@/server/session";

export default async function PropertiesPage() {
  const user = await requireUser();
  const properties = await listProperties(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">My Properties</h1>
          <p className="text-muted-foreground">
            Homes you manage in HomeSpace.
          </p>
        </div>
        <Button asChild>
          <Link href="/properties/new">New property</Link>
        </Button>
      </div>
      <div className="grid gap-3">
        {properties.map((property) => (
          <Link key={property.id} href={`/properties/${property.id}`}>
            <Card className="transition hover:border-primary/40">
              <CardHeader>
                <CardTitle>{property.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {property.address ?? "No address"} · {property.roomCount} rooms
                · {formatGBP(property.inventoryValuePence)}
              </CardContent>
            </Card>
          </Link>
        ))}
        {properties.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-muted-foreground">
              No properties yet.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
