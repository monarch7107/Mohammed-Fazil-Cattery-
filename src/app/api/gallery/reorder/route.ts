import { NextResponse } from "next/server";
import { z } from "zod";
import { getStore } from "@/lib/db";
import {
  requireAdmin,
  assertSameOrigin,
  badRequest,
  unauthorized,
  forbidden,
  serverError,
} from "@/lib/auth/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1).max(500),
});

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return forbidden();
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid reorder payload.", parsed.error.issues);

  try {
    const store = await getStore();
    const ok = await store.reorderGallery(parsed.data.orderedIds);
    if (!ok) return badRequest("Nothing to reorder.");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/gallery/reorder] POST failed", error);
    return serverError();
  }
}
