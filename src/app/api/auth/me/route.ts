import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { activeDriver } from "@/lib/storage";
import { isSupabaseClientConfigured } from "@/lib/supabase/client";
import { currentSupabaseUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  const user = session ? await currentSupabaseUser() : null;

  return NextResponse.json({
    authenticated: Boolean(session) && Boolean(user),
    email: session?.email ?? null,
    name: session?.name ?? null,
    environment: {
      database: isSupabaseClientConfigured() ? "postgres" : "memory",
      storage: activeDriver().name,
    },
  });
}
