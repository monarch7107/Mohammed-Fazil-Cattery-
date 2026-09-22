import { cert, getApps, initializeApp, type App } from "firebase-admin/app";

/**
 * Internal singleton accessor shared by admin.ts and auth.ts. Keeping the
 * app creation here lets both modules import without circular imports.
 */

const value = (key: string): string | undefined => process.env[key]?.trim() || undefined;

function normalizePrivateKey(raw: string): string {
  let key = raw.trim();
  if (!key.startsWith("-----BEGIN")) return key;
  if (key.includes("\\n")) {
    key = key.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");
  }
  return key;
}

function credentials() {
  const projectId = value("FIREBASE_PROJECT_ID");
  const clientEmail = value("FIREBASE_CLIENT_EMAIL");
  const privateKeyRaw = value("FIREBASE_PRIVATE_KEY");

  if (!projectId || !clientEmail || !privateKeyRaw) return null;

  try {
    return cert({
      projectId,
      clientEmail,
      privateKey: normalizePrivateKey(privateKeyRaw),
    });
  } catch (error) {
    console.error("[firebase-admin] invalid service-account credentials:", (error as Error).message);
    return null;
  }
}

const globalRef = globalThis as typeof globalThis & {
  __mfcFirebaseAdminApp?: App;
};

/** Returns the initialised Admin app, or null when unconfigured. */
export function adminApp(): App | null {
  const creds = credentials();
  if (!creds) return null;

  if (globalRef.__mfcFirebaseAdminApp) return globalRef.__mfcFirebaseAdminApp;

  const existing = getApps().find((app) => app.name === "mfc-admin");
  const app = existing ?? initializeApp({ credential: creds }, "mfc-admin");
  globalRef.__mfcFirebaseAdminApp = app;
  return app;
}

/** True when the Admin SDK can be initialised (all three env vars present). */
export function isFirebaseAdminConfigured(): boolean {
  return credentials() !== null;
}
