import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { assertSameOrigin, forbidden } from "@/lib/auth/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return forbidden();

  // End the Supabase Auth session server-side (clears the auth cookies via
  // the cookie-bound client) and the app's signed session cookie.
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut().catch(() => undefined);
  }
  await clearSessionCookie();

  return NextResponse.json({ ok: true });
}
