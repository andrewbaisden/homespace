import { headers } from "next/headers";
import { auth } from "@/server/auth";

export class AppError extends Error {
  constructor(
    message: string,
    public status: number = 400,
    public code?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function requireUser() {
  const session = await getSession();
  if (!session?.user) {
    throw new AppError("Unauthorised", 401, "UNAUTHORISED");
  }
  return session.user;
}

export function jsonError(error: unknown) {
  if (error instanceof AppError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.status },
    );
  }
  console.error(error);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
