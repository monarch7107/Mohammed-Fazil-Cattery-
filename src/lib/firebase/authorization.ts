import "server-only";

import { COLLECTIONS, firestore } from "@/lib/firebase/admin";

/**
 * Admin authorisation.
 *
 * A signed-in Firebase user may administer the site only when an explicit
 * `admins` document authorises them:
 *
 *   admins/{docId} = { uid, email, role: "admin", active: true, createdAt }
 *
 * The lookup matches either the UID or the lowercased email, and `active`
 * must not be false. Arbitrary Firebase users can never become admins.
 */

export interface AdminRecord {
  id: string;
  uid: string | null;
  email: string;
  role: "admin";
  active: boolean;
}

export async function isAdminAuthorized(uid: string, email: string | null): Promise<boolean> {
  const db = firestore();
  if (!db) return false;

  const admins = db.collection(COLLECTIONS.admins);

  try {
    const byUid = await admins.where("uid", "==", uid).limit(1).get();
    if (!byUid.empty) {
      const data = byUid.docs[0].data();
      return data.active !== false;
    }

    const normalizedEmail = email?.trim().toLowerCase();
    if (normalizedEmail) {
      const byEmail = await admins.where("email", "==", normalizedEmail).limit(1).get();
      if (!byEmail.empty) {
        const data = byEmail.docs[0].data();
        return data.active !== false;
      }
    }

    return false;
  } catch (error) {
    console.error("[firebase-authz] admin lookup failed:", (error as Error).message);
    return false;
  }
}

/** Best-effort admin record for display purposes (never used for decisions). */
export async function findAdminRecord(uid: string, email: string | null): Promise<AdminRecord | null> {
  const db = firestore();
  if (!db) return null;

  const admins = db.collection(COLLECTIONS.admins);

  try {
    const byUid = await admins.where("uid", "==", uid).limit(1).get();
    if (!byUid.empty) {
      const doc = byUid.docs[0];
      return {
        id: doc.id,
        uid,
        email: String(doc.data().email ?? email ?? ""),
        role: "admin",
        active: doc.data().active !== false,
      };
    }

    const normalizedEmail = email?.trim().toLowerCase();
    if (normalizedEmail) {
      const byEmail = await admins.where("email", "==", normalizedEmail).limit(1).get();
      if (!byEmail.empty) {
        const doc = byEmail.docs[0];
        return {
          id: doc.id,
          uid: (doc.data().uid as string | null) ?? null,
          email: String(doc.data().email ?? normalizedEmail),
          role: "admin",
          active: doc.data().active !== false,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}
