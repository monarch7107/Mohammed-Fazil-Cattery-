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
import { productInputSchema, toProductInput } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const animal = url.searchParams.get("animal");
    const category = url.searchParams.get("category");

    const store = await getStore();
    const products = await store.listProducts({
      ...(animal === "cat" || animal === "dog" ? { animal } : {}),
      ...(category === "dry" || category === "wet" ? { category } : {}),
    });
    return NextResponse.json({ products });
  } catch (error) {
    console.error("[api/products] GET failed", error);
    return serverError();
  }
}

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return forbidden();
  if (!rateLimit(clientKey(request, "product:create"), 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = productInputSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Please review the product details.", parsed.error.issues);
  }

  try {
    const store = await getStore();
    const product = await store.createProduct(toProductInput(parsed.data));
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("[api/products] POST failed", error);
    return serverError();
  }
}
