import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { prisma } from "@/server/db";
import { AppError, jsonError, requireUser } from "@/server/session";

type Params = { params: Promise<{ id: string }> };

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id: itemId } = await params;

    const item = await prisma.inventoryItem.findFirst({
      where: { id: itemId, room: { property: { userId: user.id } } },
    });
    if (!item) throw new AppError("Item not found", 404, "NOT_FOUND");

    const form = await request.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") ?? "PHOTO");
    if (!(file instanceof File)) {
      throw new AppError("file is required", 400, "INVALID_INPUT");
    }
    if (!ALLOWED.has(file.type)) {
      throw new AppError("Unsupported file type", 400, "INVALID_INPUT");
    }
    if (file.size > MAX_BYTES) {
      throw new AppError("File too large (max 5MB)", 400, "INVALID_INPUT");
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const safeName = `${itemId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    let storageKey = safeName;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`homespace/${safeName}`, bytes, {
        access: "private",
        contentType: file.type,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      storageKey = blob.url;
    } else {
      const dir = path.join(process.cwd(), "uploads");
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, safeName), bytes);
      storageKey = `uploads/${safeName}`;
    }

    const attachment = await prisma.attachment.create({
      data: {
        inventoryItemId: itemId,
        kind: kind === "RECEIPT" ? "RECEIPT" : "PHOTO",
        storageKey,
        mimeType: file.type,
        sizeBytes: file.size,
      },
    });

    return Response.json(attachment, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
