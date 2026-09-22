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
import { productInputSchema, toProductInput } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const store = await getStore();
    const product = await store.getProduct(id);
    if (!product) return notFound("That product could not be found.");
    return NextResponse.json({ product });
  } catch (error) {
    console.error("[api/products/:id] GET failed", error);
    return serverError();
  }
}

export async function PUT(request: Request, { params }: Params) {
  if (!assertSameOrigin(request)) return forbidden();
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = productInputSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Please review the product details.", parsed.error.issues);
  }

  try {
    const store = await getStore();
    const product = await store.updateProduct(id, toProductInput(parsed.data));
    if (!product) return notFound("That product could not be found.");
    return NextResponse.json({ product });
  } catch (error) {
    console.error("[api/products/:id] PUT failed", error);
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
    const removed = await store.deleteProduct(id);
    if (!removed) return notFound("That product could not be found.");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/products/:id] DELETE failed", error);
    return serverError();
  }
}
