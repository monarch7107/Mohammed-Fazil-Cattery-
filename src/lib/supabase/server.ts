import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseClientConfigured, supabaseUrl, supabasePublishableKey } from "./client";

/**
 * RLS-scoped Supabase server client (publishable key only).
 *
 * This is the ONLY server-side Supabase client in the application. It is
 * bound to the caller's auth cookies, so every database operation executes
 * under PostgreSQL Row Level Security with the caller's real identity:
 *
 *   - anonymous visitor  → queries run as `anon`, read-only policies apply
 *   - authenticated user → queries run as `authenticated` with auth.uid()
 *   - authorised admin   → the `admins` table + RLS grant full CRUD
 *
 * There is NO privileged client and NO secret key in this codebase: nothing
 * bypasses RLS, so the RLS policies in supabase/schema.sql are the actual
 * security boundary, not just a backstop.
 *
 * NOTE: Supabase Storage is intentionally NOT used — images live in
 * Cloudinary (see src/lib/storage/index.ts).
 */

const globalRef = globalThis as typeof globalThis & { __mfcSupabaseServer?: SupabaseClient };

export type SupabaseServerClient = SupabaseClient;

/**
 * Cookie-bound client. Because module state cannot hold `cookies()` across
 * requests safely in serverless, a fresh client is created per request when
 * no cached instance exists yet — the cache only lives for the lifetime of
 * the isolate and always reads the live cookie jar.
 */
export async function getSupabaseServerClient(): Promise<SupabaseServerClient | null> {
  if (!isSupabaseClientConfigured()) return null;

  if (globalRef.__mfcSupabaseServer) return globalRef.__mfcSupabaseServer;

  const cookieStore = await cookies();

  const client = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a context that cannot set cookies (e.g. a Server
          // Component render). Safe to ignore: src/middleware.ts refreshes
          // sessions on every request.
        }
      },
    },
  });

  try {
    globalRef.__mfcSupabaseServer = client;
  } catch {
    // Best-effort cache only.
  }

  return client;
}

/**
 * True when the current request's cookies belong to a Supabase Auth user
 * who has an active `admins` row (identity-based authorization).
 *
 * Implemented via the security-definer RPC `public.is_cattery_admin()` so
 * the check cannot recurse and cannot be spoofed from the client.
 */
export async function currentRequestIsAdmin(): Promise<boolean> {
  const client = await getSupabaseServerClient();
  if (!client) return false;

  const { data, error } = await client.rpc("is_cattery_admin");
  if (error) {
    console.error("[supabase] is_cattery_admin failed:", error.message);
    return false;
  }
  return data === true;
}

/**
 * The signed-in user's email, or null when unauthenticated / unconfigured.
 * Used by /api/auth/me for display only — never for authorization.
 */
export async function currentSupabaseUser(): Promise<{
  id: string;
  email: string | null;
  name: string | null;
} | null> {
  const client = await getSupabaseServerClient();
  if (!client) return null;

  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;

  const metaName = data.user.user_metadata?.name;
  return {
    id: data.user.id,
    email: data.user.email ?? null,
    name: typeof metaName === "string" && metaName ? metaName : null,
  };
}
