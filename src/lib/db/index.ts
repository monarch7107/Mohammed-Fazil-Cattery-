import type { DataStore } from "@/lib/db/types";
import { hasFirebaseConfig, firebaseStore } from "@/lib/db/firebase";
import { memoryStore } from "@/lib/db/memory";

export type { DataStore } from "@/lib/db/types";

const globalRef = globalThis as typeof globalThis & {
  __mfcActiveStore?: DataStore;
  __mfcStoreWarned?: boolean;
};

/**
 * Returns the active data store.
 *
 * - Firebase Admin credentials configured → Firestore
 * - otherwise → in-memory driver with clearly-labelled placeholder data
 *
 * Keeping the storage contract behind DataStore means the public site and
 * admin panel do not care which persistence provider is used.
 */
export async function getStore(): Promise<DataStore> {
  if (!hasFirebaseConfig()) {
    warnOnce(
      "Firebase is not configured — running with the in-memory development store (placeholder data)."
    );
    return memoryStore;
  }

  if (!globalRef.__mfcActiveStore) {
    try {
      await firebaseStore.stats();
      globalRef.__mfcActiveStore = firebaseStore;
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
  if (!hasFirebaseConfig() || globalRef.__mfcActiveStore?.mode === "memory") {
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

export const db = {
  get store() {
    return getStore();
  },
};
