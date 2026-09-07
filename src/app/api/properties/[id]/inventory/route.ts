import {
  exportInventoryCsv,
  listInventory,
} from "@/server/services/property-service";
import { jsonError, requireUser } from "@/server/session";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");

    if (format === "csv") {
      const csv = await exportInventoryCsv(user.id, id);
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="homespace-inventory-${id}.csv"`,
        },
      });
    }

    const result = await listInventory(user.id, id, {
      q: searchParams.get("q") ?? undefined,
      roomId: searchParams.get("roomId") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      condition: searchParams.get("condition") ?? undefined,
      minValuePence: searchParams.get("minValuePence")
        ? Number(searchParams.get("minValuePence"))
        : undefined,
      maxValuePence: searchParams.get("maxValuePence")
        ? Number(searchParams.get("maxValuePence"))
        : undefined,
      recent: searchParams.get("recent") === "true",
    });
    return Response.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
