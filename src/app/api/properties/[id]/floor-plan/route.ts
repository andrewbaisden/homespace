import { getFloorPlan, putFloorPlan } from "@/server/services/property-service";
import { jsonError, requireUser } from "@/server/session";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const floorPlan = await getFloorPlan(user.id, id);
    return Response.json(floorPlan);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();
    const floorPlan = await putFloorPlan(user.id, id, body.geometry ?? body);
    return Response.json(floorPlan);
  } catch (error) {
    return jsonError(error);
  }
}
