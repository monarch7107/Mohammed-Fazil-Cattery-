import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Supabase Auth session middleware.
 *
 * The whole backend runs on the PUBLISHABLE key only — there is no secret
 * key anywhere in this application. Security comes from Supabase Auth +
 * PostgreSQL Row Level Security, which both need a real, verified user
 * identity on every database call.
 *
 * This middleware keeps that identity fresh: Supabase access tokens are
 * short-lived JWTs, and @supabase/ssr refreshes them when they are about to
 * expire. The refreshed tokens are written back to the request cookies so
 * every Server Component, route handler and RLS-scoped query in the same
 * request sees the up-to-date session.
 *
 * Anonymous visitors simply carry no auth cookies; their queries run under
 * the anonymous role with read-only RLS policies.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || "";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  if (!supabaseUrl || !supabasePublishableKey) {
    return response;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Persist refreshed tokens for the rest of this request…
            request.cookies.set(name, value);
            // …and hand them back to the browser.
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    // Touching getUser() (not getSession()) forces token validation and
    // triggers the refresh when the access token is near expiry.
    await supabase.auth.getUser();
  } catch {
    // Network hiccup with Supabase Auth must never take the site down —
    // the request continues with whatever cookies it had.
  }

  return response;
}

export const config = {
  // Refresh on every page and API route, skip Next.js internals and assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
