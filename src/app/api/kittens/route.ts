import { NextResponse } from "next/server";
import { getStore } from "@/lib/db";
import { requireAdmin, assertSameOrigin, badRequest, unauthorized, forbidden, rateLimit, clientKey, serverError } from "@/lib/auth/guard";
import { kittenInputSchema, toKittenInput } from "@/lib/validation";
import { KITTEN_STATUSES, type KittenStatus } from "@/models/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const featured = url.searchParams.get("featured");

    const store = await getStore();
    const kittens = await store.listKittens({
      ...(status && KITTEN_STATUSES.includes(status as KittenStatus)
        ? { status: status as KittenStatus }
        : {}),
      ...(featured === "true" ? { featured: true } : {}),
    });
    return NextResponse.json({ kittens });
  } catch (error) {
    console.error("[api/kittens] GET failed", error);
    return serverError();
  }
}

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return forbidden();
  if (!rateLimit(clientKey(request, "kitten:create"), 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = kittenInputSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Please review the kitten details.", parsed.error.issues);
  }

  try {
    const store = await getStore();
    const kitten = await store.createKitten(toKittenInput(parsed.data));
    return NextResponse.json({ kitten }, { status: 201 });
  } catch (error) {
    console.error("[api/kittens] POST failed", error);
    return serverError();
  }
}
