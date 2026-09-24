import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Supabase server client for Next.js App Router (route handlers, server
 * components). Uses the publishable key + the caller's cookies, so every
 * query runs under PostgreSQL RLS with the caller's real identity.
 *
 * NOTE: Supabase Storage is intentionally NOT used — images live in
 * Cloudinary (see src/lib/storage/index.ts).
 */

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || "";

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabasePublishableKey);
}

/** RLS-scoped server client bound to the request's cookies. Null when unconfigured. */
export async function getSupabaseServerClient() {
  if (!isSupabaseConfigured()) return null;

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabasePublishableKey, {
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
          // Called from a Server Component — safe to ignore when middleware
          // refreshes sessions; route handlers can always set cookies.
        }
      },
    },
  });
}
