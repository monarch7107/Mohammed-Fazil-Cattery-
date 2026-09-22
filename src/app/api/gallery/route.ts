import { NextResponse } from "next/server";
import { getStore } from "@/lib/db";
import {
  requireAdmin,
  assertSameOrigin,
  badRequest,
  unauthorized,
  forbidden,
  rateLimit,
  clientKey,
  serverError,
} from "@/lib/auth/guard";
import { galleryInputSchema, toGalleryInput } from "@/lib/validation";
import { GALLERY_CATEGORIES, type GalleryCategory } from "@/models/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const store = await getStore();
    const items = await store.listGallery(
      category && GALLERY_CATEGORIES.includes(category as GalleryCategory)
        ? { category: category as GalleryCategory }
        : {}
    );
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[api/gallery] GET failed", error);
    return serverError();
  }
}

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return forbidden();
  if (!rateLimit(clientKey(request, "gallery:create"), 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = galleryInputSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Please review the gallery entry.", parsed.error.issues);
  }

  try {
    const store = await getStore();
    const existing = await store.listGallery();
    const item = await store.createGallery({
      ...toGalleryInput(parsed.data),
      sortOrder: parsed.data.sortOrder ?? existing.length,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("[api/gallery] POST failed", error);
    return serverError();
  }
}
