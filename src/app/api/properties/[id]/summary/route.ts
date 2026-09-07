import { getPropertySummary } from "@/server/services/property-service";
import { jsonError, requireUser } from "@/server/session";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const summary = await getPropertySummary(user.id, id);
    return Response.json(summary);
  } catch (error) {
    return jsonError(error);
  }
}
