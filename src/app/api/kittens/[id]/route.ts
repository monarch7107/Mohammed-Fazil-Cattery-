import { NextResponse } from "next/server";
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
import { kittenInputSchema, toKittenInput } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const store = await getStore();
    const kitten = await store.getKitten(id);
    if (!kitten) return notFound("That kitten could not be found.");
    return NextResponse.json({ kitten });
  } catch (error) {
    console.error("[api/kittens/:id] GET failed", error);
    return serverError();
  }
}

export async function PUT(request: Request, { params }: Params) {
  if (!assertSameOrigin(request)) return forbidden();
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = kittenInputSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Please review the kitten details.", parsed.error.issues);
  }

  try {
    const store = await getStore();
    const kitten = await store.updateKitten(id, toKittenInput(parsed.data));
    if (!kitten) return notFound("That kitten could not be found.");
    return NextResponse.json({ kitten });
  } catch (error) {
    console.error("[api/kittens/:id] PUT failed", error);
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
    const removed = await store.deleteKitten(id);
    if (!removed) return notFound("That kitten could not be found.");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/kittens/:id] DELETE failed", error);
    return serverError();
  }
}
