import {
  createProperty,
  listProperties,
} from "@/server/services/property-service";
import { jsonError, requireUser } from "@/server/session";

export async function GET() {
  try {
    const user = await requireUser();
    const properties = await listProperties(user.id);
    return Response.json(properties);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const property = await createProperty(user.id, body);
    return Response.json(property, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
