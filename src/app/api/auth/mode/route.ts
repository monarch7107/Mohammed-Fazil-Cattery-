import { NextResponse } from "next/server";
import { isSupabaseClientConfigured } from "@/lib/supabase/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tells the login form which flow to use:
 *  - supabase: true  → Supabase Auth sign-in, then access-token exchange
 *  - supabase: false → the endpoint is not usable; the form shows an error
 */
export async function GET() {
  return NextResponse.json({ supabase: isSupabaseClientConfigured() });
}
