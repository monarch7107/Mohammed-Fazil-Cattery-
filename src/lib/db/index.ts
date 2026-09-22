import type { DataStore } from "@/lib/db/types";
import { hasMongoConfig, mongoStore } from "@/lib/db/mongo";
import { memoryStore } from "@/lib/db/memory";

export type { DataStore } from "@/lib/db/types";

const globalRef = globalThis as typeof globalThis & {
  __mfcActiveStore?: DataStore;
  __mfcStoreWarned?: boolean;
};

/**
 * Returns the active data store.
 *
 * - MONGODB_URI configured  → MongoDB (production + Atlas development)
 * - otherwise               → in-memory driver with clearly-labelled
 *                             placeholder data, so the site, the API and the
 *                             admin panel all keep working during development.
 */
export async function getStore(): Promise<DataStore> {
  if (!hasMongoConfig()) {
    warnOnce(
      "MONGODB_URI is not set — running with the in-memory development store (placeholder data)."
    );
    return memoryStore;
  }

  if (!globalRef.__mfcActiveStore) {
    try {
      await mongoStore.stats(); // forces connection + first-run seed
      globalRef.__mfcActiveStore = mongoStore;
    } catch (error) {
      warnOnce(
        `MongoDB connection failed (${(error as Error).message}) — falling back to the in-memory store.`
      );
      globalRef.__mfcActiveStore = memoryStore;
    }
  }

  return globalRef.__mfcActiveStore;
}

/** Non-blocking variant for rendering paths that must never throw. */
export function getStoreSafe(): DataStore {
  if (!hasMongoConfig() || globalRef.__mfcActiveStore?.mode === "memory") {
    return globalRef.__mfcActiveStore ?? memoryStore;
  }
  if (globalRef.__mfcActiveStore) return globalRef.__mfcActiveStore;
  // Kick the connection off; reads below will still await via getStore().
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
