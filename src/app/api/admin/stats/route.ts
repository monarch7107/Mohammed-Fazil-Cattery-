import { NextResponse } from "next/server";
import { getStore } from "@/lib/db";
import { requireAdmin, unauthorized, serverError } from "@/lib/auth/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  try {
    const store = await getStore();
    const stats = await store.stats();
    return NextResponse.json({ stats });
  } catch (error) {
    console.error("[api/admin/stats] failed", error);
    return serverError();
  }
}
