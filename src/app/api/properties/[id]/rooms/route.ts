import { createRoom } from "@/server/services/property-service";
import { jsonError, requireUser } from "@/server/session";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();
    const room = await createRoom(user.id, id, body);
    return Response.json(room, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
