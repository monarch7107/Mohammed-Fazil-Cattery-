import type { DataStore } from "@/lib/db/types";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin-app";
import { firestoreStore } from "@/lib/db/firestore";
import { memoryStore } from "@/lib/db/memory";

export type { DataStore } from "@/lib/db/types";

const globalRef = globalThis as typeof globalThis & {
  __mfcActiveStore?: DataStore;
  __mfcStoreWarned?: boolean;
};

/** True when the app runs in a real production deployment. */
function isProduction(): boolean {
  // VERCEL_ENV is set to "production" by Vercel only in the real production
  // deployment. A plain NODE_ENV=production process (CI smoke tests, a local
  // `next start`, container builds) is NOT a production data environment:
  // those have no Firebase credentials by design, so they run the clearly-
  // labelled in-memory driver instead of failing closed.
  return process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production";
}

/**
 * Returns the active data store.
 *
 * PRODUCTION (fail closed): Firestore only. Without Firebase Admin
 * credentials — or when Firestore is unreachable — the app refuses to serve
 * data rather than silently downgrading: placeholder data must never
 * masquerade as production content.
 *
 * DEVELOPMENT: in-memory driver with clearly-labelled placeholder data so
 * the site, API and admin panel keep working before Firebase is configured.
 */
export async function getStore(): Promise<DataStore> {
  if (!isFirebaseAdminConfigured()) {
    if (isProduction()) {
      throw new Error(
        "Firebase Admin credentials are not set. Firestore is the production database — " +
          "set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY."
      );
    }
    warnOnce(
      "Firebase Admin credentials are not set — running with the in-memory development store (placeholder data)."
    );
    return memoryStore;
  }

  if (!globalRef.__mfcActiveStore) {
    try {
      await firestoreStore.stats(); // forces connection + first-run seed
      globalRef.__mfcActiveStore = firestoreStore;
    } catch (error) {
      if (isProduction()) {
        // Fail closed: a broken Firestore connection must never downgrade
        // production to the in-memory store.
        throw error;
      }
      warnOnce(
        `Firestore connection failed (${(error as Error).message}) — falling back to the in-memory store.`
      );
      globalRef.__mfcActiveStore = memoryStore;
      return memoryStore;
    }
  }

  return globalRef.__mfcActiveStore;
}

function warnOnce(message: string) {
  if (globalRef.__mfcStoreWarned) return;
  globalRef.__mfcStoreWarned = true;
  console.warn(`[cattery] ${message}`);
}

/** Convenience helpers used by pages and API routes. */
export const db = {
  get store() {
    return getStore();
  },
};
