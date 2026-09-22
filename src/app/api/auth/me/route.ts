import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { activeDriver } from "@/lib/storage";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin-app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  return NextResponse.json({
    authenticated: Boolean(session),
    email: session?.email ?? null,
    name: session?.name ?? null,
    environment: {
      database: isFirebaseAdminConfigured() ? "firebase" : "memory",
      storage: activeDriver().name,
    },
  });
}
