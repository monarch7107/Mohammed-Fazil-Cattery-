import "server-only";

import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { adminApp, isFirebaseAdminConfigured } from "./admin-app";

/**
 * Firebase ADMIN SDK — server-side only.
 *
 * Credentials come from three environment variables (never NEXT_PUBLIC_*):
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY   (literal \n sequences are converted to real newlines)
 *
 * The SDK instance is cached on globalThis to survive HMR and reused across
 * warm serverless invocations.
 *
 * NOTE: Firebase Storage is intentionally NOT initialised — images are
 * stored in Cloudinary (see src/lib/storage/index.ts).
 */

export { isFirebaseAdminConfigured };

/** Firestore handle, or null when the Admin SDK is not configured. */
export function firestore(): Firestore | null {
  const app = adminApp();
  if (!app) return null;
  try {
    return getFirestore(app);
  } catch (error) {
    console.error("[firebase-admin] Firestore unavailable:", (error as Error).message);
    return null;
  }
}

export const COLLECTIONS = {
  admins: "admins",
  kittens: "kittens",
  products: "products",
  gallery: "gallery",
} as const;
