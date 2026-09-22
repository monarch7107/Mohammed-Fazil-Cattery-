import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";
import { assertSameOrigin, forbidden } from "@/lib/auth/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return forbidden();
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
