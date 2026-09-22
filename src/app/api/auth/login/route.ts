import { NextResponse } from "next/server";
import { getStore } from "@/lib/db";
import { verifyPassword, dummyVerify } from "@/lib/auth/password";
import { envAdmins } from "@/lib/auth/env-admins";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { verifyIdToken } from "@/lib/firebase/auth";
import { isAdminAuthorized } from "@/lib/firebase/authorization";
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

  const { email, password, idToken } = parsed.data;

  try {
    let uid: string | null = null;
    let name = "Administrator";
    let valid = false;

    /* ---------------------------------------------------------------
     * Firebase Authentication path (production).
     * The client signs in with the Firebase JS SDK and posts the ID
     * token; the server verifies it, then checks the `admins`
     * collection for explicit authorisation.
     * --------------------------------------------------------------- */
    if (idToken) {
      const decoded = await verifyIdToken(idToken);
      if (decoded) {
        const authorized = await isAdminAuthorized(decoded.uid, decoded.email ?? email);
        if (authorized) {
          valid = true;
          uid = decoded.uid;
          name = "Administrator";
        }
      }

      if (!valid) {
        return unauthorized("Email or password is incorrect.");
      }
    } else {
      /* -------------------------------------------------------------
       * Legacy path (works before/without Firebase credentials):
       * environment-configured admin accounts with scrypt hashes.
       * ------------------------------------------------------------- */
      const envAdmin = envAdmins().find((candidate) => candidate.email === email);

      if (envAdmin) {
        valid = await verifyPassword(password, envAdmin.passwordHash);
        name = envAdmin.name;
        uid = envAdmin.id;
      } else {
        await dummyVerify();
      }

      if (!valid) {
        return unauthorized("Email or password is incorrect.");
      }
    }

    resetRateLimit(key);

    const token = createSessionToken({
      sub: uid ?? "env-admin",
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
