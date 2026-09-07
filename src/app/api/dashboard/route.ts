import { getDashboard } from "@/server/services/property-service";
import { jsonError, requireUser } from "@/server/session";

export async function GET() {
  try {
    const user = await requireUser();
    const dashboard = await getDashboard(user.id);
    return Response.json(dashboard);
  } catch (error) {
    return jsonError(error);
  }
}
