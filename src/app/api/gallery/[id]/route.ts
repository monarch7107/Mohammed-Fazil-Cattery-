import { NextResponse } from "next/server";
import { z } from "zod";
import { getStore } from "@/lib/db";
import {
  requireAdmin,
  assertSameOrigin,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError,
} from "@/lib/auth/guard";
import { removeImages } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

const patchSchema = z.object({
  caption: z.string().trim().max(160).optional(),
  category: z.enum(["kittens", "cats", "pet-food", "cattery"]).optional(),
  sortOrder: z.coerce.number().int().min(0).max(10_000).optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  if (!assertSameOrigin(request)) return forbidden();
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid gallery update.", parsed.error.issues);

  try {
    const store = await getStore();
    const item = await store.updateGallery(id, parsed.data);
    if (!item) return notFound("That gallery entry could not be found.");
    return NextResponse.json({ item });
  } catch (error) {
    console.error("[api/gallery/:id] PATCH failed", error);
    return serverError();
  }
}

export async function DELETE(request: Request, { params }: Params) {
  if (!assertSameOrigin(request)) return forbidden();
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const { id } = await params;
  try {
    const store = await getStore();
    const item = await store.getGalleryItem(id);
    if (!item) return notFound("That gallery entry could not be found.");

    const removed = await store.deleteGallery(id);

    // Best-effort asset cleanup (no-op for placeholder records). The storage
    // driver decides how to interpret the key: a Cloudinary public_id for
    // cloud uploads, an /uploads/ path for local development files.
    if (removed) {
      await removeImages([item.image]);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/gallery/:id] DELETE failed", error);
    return serverError();
  }
}
