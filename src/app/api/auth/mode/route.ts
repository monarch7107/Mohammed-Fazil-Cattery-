import { NextResponse } from "next/server";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin-app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tells the login form which flow to use:
 *  - firebase: true  → Firebase Auth (ID-token exchange)
 *  - firebase: false → legacy password endpoint (env-configured accounts)
 */
export async function GET() {
  return NextResponse.json({ firebase: isFirebaseAdminConfigured() });
}
