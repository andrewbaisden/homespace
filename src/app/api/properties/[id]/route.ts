import {
  deleteProperty,
  getProperty,
  updateProperty,
} from "@/server/services/property-service";
import { jsonError, requireUser } from "@/server/session";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const property = await getProperty(user.id, id);
    return Response.json(property);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();
    const property = await updateProperty(user.id, id, body);
    return Response.json(property);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await deleteProperty(user.id, id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return jsonError(error);
  }
}
