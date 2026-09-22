import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "@/lib/auth/session";

/**
 * Server-side guard for admin pages. Unauthenticated visitors are sent to the
 * login screen with their intended destination preserved.
 */
export async function requireAdminPage(pathname?: string): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    const returnTo = pathname ? `?returnTo=${encodeURIComponent(pathname)}` : "";
    redirect(`/admin/login${returnTo}`);
  }
  return session;
}
