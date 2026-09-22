import "server-only";

import { getAuth } from "firebase-admin/auth";

/**
 * Server-side Firebase Authentication verification.
 *
 * The admin login flow (client) exchanges email + password for a Firebase ID
 * token via the JS SDK, then POSTs it to /api/auth/login. The server verifies
 * it with the Admin SDK (revocation-checked), confirms the UID is an
 * authorised admin in Firestore, and issues the existing signed httpOnly
 * session cookie used by every guard in the app.
 */
export async function verifyIdToken(
  idToken: string
): Promise<{ uid: string; email: string | null } | null> {
  const { adminApp } = await import("@/lib/firebase/admin-app");
  const app = adminApp();
  if (!app) return null;

  try {
    const auth = getAuth(app);
    const decoded = await auth.verifyIdToken(idToken, true);
    return { uid: decoded.uid, email: decoded.email ?? null };
  } catch (error) {
    console.warn("[firebase-auth] ID token verification failed:", (error as Error).message);
    return null;
  }
}
