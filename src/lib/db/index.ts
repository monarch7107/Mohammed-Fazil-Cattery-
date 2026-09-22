import type { DataStore } from "@/lib/db/types";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin-app";
import { firestoreStore } from "@/lib/db/firestore";
import { memoryStore } from "@/lib/db/memory";

export type { DataStore } from "@/lib/db/types";

const globalRef = globalThis as typeof globalThis & {
  __mfcActiveStore?: DataStore;
  __mfcStoreWarned?: boolean;
};

/**
 * Returns the active data store.
 *
 * - Firebase Admin credentials configured → Firestore (production)
 * - otherwise                             → in-memory driver with clearly-
 *                                           labelled placeholder data, so the
 *                                           site, API and admin panel keep
 *                                           working during development.
 */
export async function getStore(): Promise<DataStore> {
  if (!isFirebaseAdminConfigured()) {
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
      warnOnce(
        `Firestore connection failed (${(error as Error).message}) — falling back to the in-memory store.`
      );
      globalRef.__mfcActiveStore = memoryStore;
    }
  }

  return globalRef.__mfcActiveStore;
}

/** Non-blocking variant for rendering paths that must never throw. */
export function getStoreSafe(): DataStore {
  if (!isFirebaseAdminConfigured() || globalRef.__mfcActiveStore?.mode === "memory") {
    return globalRef.__mfcActiveStore ?? memoryStore;
  }
  if (globalRef.__mfcActiveStore) return globalRef.__mfcActiveStore;
  void getStore().catch(() => undefined);
  return globalRef.__mfcActiveStore ?? memoryStore;
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
