/**
 * Supabase browser client (publishable/anon key only).
 *
 * The publishable key is safe for the browser — real authorization is
 * enforced by PostgreSQL Row Level Security, never by key secrecy.
 *
 * NOTE: Supabase Storage is intentionally NOT used — images live in
 * Cloudinary (see src/lib/storage/index.ts).
 */
import { createBrowserClient } from "@supabase/ssr";

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || "";

export function isSupabaseClientConfigured(): boolean {
  return Boolean(supabaseUrl && supabasePublishableKey);
}

/** Browser client for auth (sign-in); data flows through the Next.js API layer. */
export function getSupabaseBrowserClient() {
  if (!isSupabaseClientConfigured()) return null;
  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
