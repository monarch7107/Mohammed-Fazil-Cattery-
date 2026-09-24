import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/supabase/admin";
import { isAdminAuthorized } from "@/lib/supabase/authorization";
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
 * Supabase Authentication login.
 *
 * The client signs in with the Supabase JS SDK (email + password) and posts
 * the resulting access token; the server verifies it against Supabase Auth,
 * confirms the user is an explicitly-authorised admin (active `admins` row),
 * and issues the existing signed httpOnly session cookie used by every
 * guard in the app. Client-supplied roles are never trusted.
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

  const { email, password, accessToken } = parsed.data;

  try {
    if (!accessToken) {
      // The login form always authenticates with Supabase Auth first; a
      // password-only POST is only meaningful for the legacy env-admin path,
      // which no longer exists. Same generic error as a bad credential.
      return unauthorized("Email or password is incorrect.");
    }

    const user = await verifyAccessToken(accessToken);
    if (!user) {
      return unauthorized("Email or password is incorrect.");
    }

    const authorized = await isAdminAuthorized(user.id);
    if (!authorized) {
      // Valid Supabase user, but not an authorised admin.
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
