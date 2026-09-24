import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
/**
 * Privileged server-side Supabase client (secret key / service role).
 *
 * Used ONLY by the server-side DataStore so writes are not constrained by
 * RLS' view of an anonymous caller — the Next.js API layer is the gate
 * (session cookie + admin authorization). The secret never reaches the
 * browser: it has no NEXT_PUBLIC_ prefix and this module is "server-only".
 *
 * Accepted variables (either form):
 *   SUPABASE_SECRET_KEY    — new-style sb_secret_… key
 *   SUPABASE_SERVICE_ROLE_KEY — legacy service-role JWT
 *   SUPABASE_URL / SUPABASE_PROJECT_URL — optional server-side URL override
 */

const value = (key: string): string | undefined => process.env[key]?.trim() || undefined;

export function isSupabaseAdminConfigured(): boolean {
  return Boolean(
    supabaseAdminUrl() && (value("SUPABASE_SECRET_KEY") || value("SUPABASE_SERVICE_ROLE_KEY"))
  );
}

function supabaseAdminUrl(): string | undefined {
  return (
    value("SUPABASE_URL") ||
    value("SUPABASE_PROJECT_URL") ||
    value("NEXT_PUBLIC_SUPABASE_URL")
  );
}

function supabaseAdminKey(): string | undefined {
  return value("SUPABASE_SECRET_KEY") || value("SUPABASE_SERVICE_ROLE_KEY");
}

/** Privileged client type used by the Postgres DataStore. */
export type SupabaseAdminClient = SupabaseClient;

const globalRef = globalThis as typeof globalThis & {
  __mfcSupabaseAdmin?: SupabaseClient;
};

/** Privileged client, or null when the secret key is not configured. */
export function supabaseAdmin(): SupabaseClient | null {
  const url = supabaseAdminUrl();
  const key = supabaseAdminKey();
  if (!url || !key) return null;

  if (globalRef.__mfcSupabaseAdmin) return globalRef.__mfcSupabaseAdmin;

  const client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  globalRef.__mfcSupabaseAdmin = client;
  return client;
}

/**
 * Verify a Supabase Auth access token and return the user.
 * Uses the privileged client's auth.getUser(token) — never trusts client data.
 */
export async function verifyAccessToken(accessToken: string) {
  const client = supabaseAdmin();
  if (!client) return null;
  try {
    const { data, error } = await client.auth.getUser(accessToken);
    if (error || !data.user) return null;
    return data.user;
  } catch {
    return null;
  }
}
