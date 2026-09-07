import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatGBP } from "@/lib/money";
import { getDashboard } from "@/server/services/property-service";
import { requireUser } from "@/server/session";

export default async function DashboardPage() {
  const user = await requireUser();
  const dashboard = await getDashboard(user.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Overview of properties, rooms, and inventory value.
          </p>
        </div>
        <Button asChild>
          <Link href="/properties/new">New property</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Properties" value={String(dashboard.propertyCount)} />
        <Stat label="Rooms" value={String(dashboard.roomCount)} />
        <Stat label="Inventory items" value={String(dashboard.itemCount)} />
        <Stat
          label="Inventory value"
          value={formatGBP(dashboard.inventoryValuePence)}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Properties</h2>
        {dashboard.properties.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-muted-foreground">
              No properties yet. Create one to start your floor plan and
              inventory.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {dashboard.properties.map((property) => (
              <Link key={property.id} href={`/properties/${property.id}`}>
                <Card className="transition hover:border-primary/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{property.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {property.address ? `${property.address} · ` : ""}
                    {property.roomCount} rooms ·{" "}
                    {formatGBP(property.inventoryValuePence)}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recently modified items</h2>
        {dashboard.recentItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No inventory items yet.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border bg-card">
            {dashboard.recentItems.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-muted-foreground">
                    {item.room.property.name} · {item.room.name}
                  </p>
                </div>
                <p>{formatGBP(item.replacementValuePence * item.quantity)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-display text-2xl">{value}</p>
      </CardContent>
    </Card>
  );
}
