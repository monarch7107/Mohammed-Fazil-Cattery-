import type { DataStore } from "@/lib/db/types";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { postgresStore } from "@/lib/db/postgres";
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
  // those have no Supabase credentials by design, so they run the clearly-
  // labelled in-memory driver instead of failing closed.
  return process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production";
}

/**
 * Returns the active data store.
 *
 * PRODUCTION (fail closed): PostgreSQL (Supabase) only. Without the Supabase
 * secret key — or when the database is unreachable — the app refuses to serve
 * data rather than silently downgrading: placeholder data must never
 * masquerade as production content.
 *
 * DEVELOPMENT: in-memory driver with clearly-labelled placeholder data so
 * the site, API and admin panel keep working before Supabase is configured.
 */
export async function getStore(): Promise<DataStore> {
  if (!isSupabaseAdminConfigured()) {
    if (isProduction()) {
      throw new Error(
        "Supabase credentials are not set. PostgreSQL is the production database — " +
          "set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY)."
      );
    }
    warnOnce(
      "Supabase credentials are not set — running with the in-memory development store (placeholder data)."
    );
    return memoryStore;
  }

  if (!globalRef.__mfcActiveStore) {
    try {
      await postgresStore.stats(); // forces connection + first-run seed
      globalRef.__mfcActiveStore = postgresStore;
    } catch (error) {
      if (isProduction()) {
        // Fail closed: a broken database connection must never downgrade
        // production to the in-memory store.
        throw error;
      }
      warnOnce(
        `PostgreSQL connection failed (${(error as Error).message}) — falling back to the in-memory store.`
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
