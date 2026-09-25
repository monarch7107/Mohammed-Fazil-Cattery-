import { NextResponse } from "next/server";
import { getSupabaseServerClient, currentRequestIsAdmin } from "@/lib/supabase/server";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import {
  assertSameOrigin,
  clientKey,
  rateLimit,
  resetRateLimit,
  unauthorized,
  forbidden,
} from "@/lib/auth/guard";
import { loginSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin login — publishable-key-only Supabase Auth.
 *
 * 1. The login form signs in with the Supabase JS SDK (email + password).
 *    @supabase/ssr stores the resulting session in browser cookies, which
 *    the login request forwards to this route.
 * 2. The server reads the session from those cookies with the same
 *    publishable key — Supabase validates the JWT; nothing is trusted from
 *    the request body (no access token, no role, no isAdmin flag).
 * 3. Authorization is identity-based: the security-definer RPC
 *    `is_cattery_admin()` confirms an active `admins` row for auth.uid().
 * 4. The app's signed httpOnly session cookie is issued for the page/API
 *    guards, and the Supabase cookies stay for RLS-scoped data access.
 */
export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return forbidden();

  const key = clientKey(request, "auth:login");
  if (!rateLimit(key, 5, 10 * 60_000)) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Enter a valid email and password." },
      { status: 400 }
    );
  }

  const { email } = parsed.data;

  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Authentication is not configured. Contact the site owner." },
        { status: 503 }
      );
    }

    // Identity from cookies only — never from the request body.
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      return unauthorized("Email or password is incorrect.");
    }

    const authorized = await currentRequestIsAdmin();
    if (!authorized) {
      // Valid Supabase user, but not an authorised admin. Also clear any
      // half-signed-in session so the browser does not keep it.
      await supabase.auth.signOut().catch(() => undefined);
      return unauthorized("Email or password is incorrect.");
    }

    resetRateLimit(key);

    const name =
      (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
      "Administrator";

    const token = createSessionToken({
      sub: user.id,
      email: user.email ?? email,
      name,
    });
    await setSessionCookie(token);

    return NextResponse.json({ ok: true, email: user.email ?? email, name });
  } catch (error) {
    console.error("[api/auth/login] failed", error);
    return NextResponse.json(
      { error: "Sign-in is unavailable right now. Please try again shortly." },
      { status: 500 }
    );
  }
}
