import "server-only";

import { supabaseAdmin, type SupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Admin authorization for the Supabase architecture.
 *
 * A signed-in Supabase Auth user may administer the site only when an active
 * `admins` row ties their Auth identity to the admin role:
 *
 *   admins.id = auth.users.id, role = 'admin', active = true
 *
 * The lookup runs with the privileged server client — client-supplied roles
 * are never trusted. RLS additionally blocks non-admins from even reading
 * the admins registry.
 */

export interface AdminRecord {
  id: string;
  email: string;
  name: string;
  role: "admin";
  active: boolean;
}

export async function isAdminAuthorized(userId: string): Promise<boolean> {
  const client = supabaseAdmin();
  if (!client) return false;

  try {
    const { data, error } = await client
      .from("admins")
      .select("id, active, role")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) return false;
    return data.active === true && data.role === "admin";
  } catch (error) {
    console.error("[supabase-authz] admin lookup failed:", (error as Error).message);
    return false;
  }
}

/** Best-effort admin record for display purposes (never used for decisions). */
export async function findAdminRecord(
  client: SupabaseAdminClient,
  userId: string
): Promise<AdminRecord | null> {
  try {
    const { data } = await client
      .from("admins")
      .select("id, email, name, role, active")
      .eq("id", userId)
      .maybeSingle();

    if (!data || data.active === false || data.role !== "admin") return null;
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: "admin",
      active: true,
    };
  } catch {
    return null;
  }
}
