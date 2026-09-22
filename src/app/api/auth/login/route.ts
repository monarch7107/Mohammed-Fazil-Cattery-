import { NextResponse } from "next/server";
import { getStore } from "@/lib/db";
import { verifyPassword, dummyVerify } from "@/lib/auth/password";
import { envAdmins, type EnvAdmin } from "@/lib/auth/env-admins";
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

  const { email, password } = parsed.data;

  try {
    const store = await getStore();
    const user = await store.findAdminByEmail(email);

    // Environment-configured accounts (useful before/without a users collection).
    const envAdmin = envAdmins().find((candidate) => candidate.email === email);

    let valid = false;
    let name = "Administrator";

    if (user?.passwordHash) {
      valid = await verifyPassword(password, user.passwordHash);
      name = user.name;
    } else if (envAdmin) {
      valid = await verifyPassword(password, envAdmin.passwordHash);
      name = envAdmin.name;
    } else {
      await dummyVerify();
    }

    if (!valid) {
      return unauthorized("Email or password is incorrect.");
    }

    resetRateLimit(key);

    const token = createSessionToken({
      sub: user?.id ?? envAdmin?.id ?? "env-admin",
      email,
      name,
    });
    await setSessionCookie(token);

    return NextResponse.json({ ok: true, email, name });
  } catch (error) {
    console.error("[api/auth/login] failed", error);
    return NextResponse.json(
      { error: "Sign-in is unavailable right now. Please try again shortly." },
      { status: 500 }
    );
  }
}
