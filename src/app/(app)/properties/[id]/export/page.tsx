import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrintButton } from "@/features/export/components/print-button";
import { formatGBP } from "@/lib/money";
import { getProperty } from "@/server/services/property-service";
import { requireUser } from "@/server/session";

type Params = { params: Promise<{ id: string }> };

export default async function ExportPage({ params }: Params) {
  const user = await requireUser();
  const { id } = await params;
  let property: Awaited<ReturnType<typeof getProperty>>;
  try {
    property = await getProperty(user.id, id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="font-display text-3xl">Export inventory</h1>
          <p className="text-muted-foreground">
            Insurance-style summary. Values use replacement cost × quantity.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <a href={`/api/properties/${id}/inventory?format=csv`}>
              Download CSV
            </a>
          </Button>
          <PrintButton />
          <Button asChild variant="secondary">
            <Link href={`/properties/${id}`}>Back</Link>
          </Button>
        </div>
      </div>

      <Card className="print:border-0 print:shadow-none">
        <CardHeader>
          <CardTitle className="font-display text-2xl">
            HomeSpace inventory report
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {property.name}
            {property.address ? ` · ${property.address}` : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            Generated {new Date().toLocaleDateString("en-GB")}. Figures are
            user-supplied replacement estimates, not professional valuations.
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          {property.rooms.map((room) => {
            const total = property.roomTotals.find((r) => r.roomId === room.id);
            return (
              <section key={room.id} className="space-y-2">
                <h2 className="text-lg font-semibold">{room.name}</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-1">Item</th>
                      <th className="py-1">Qty</th>
                      <th className="py-1 text-right">Replacement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {room.items.map((item) => (
                      <tr key={item.id} className="border-b border-border/50">
                        <td className="py-2">{item.name}</td>
                        <td className="py-2">{item.quantity}</td>
                        <td className="py-2 text-right">
                          {formatGBP(
                            item.replacementValuePence * item.quantity,
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-between border-t pt-2 font-medium">
                  <span>Room total</span>
                  <span>{formatGBP(total?.totalPence ?? 0)}</span>
                </div>
              </section>
            );
          })}
          <div className="flex justify-between border-t-2 border-foreground pt-4 text-lg font-semibold">
            <span>Property total</span>
            <span>{formatGBP(property.inventoryValuePence)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
