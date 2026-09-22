import "server-only";

import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import type { Bucket } from "@google-cloud/storage";
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

/** Storage bucket handle bound to the project bucket, or null when unconfigured. */
export function storage(): Bucket | null {
  const app = adminApp();
  if (!app) return null;
  try {
    const bucketName =
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ||
      `${process.env.FIREBASE_PROJECT_ID?.trim()}.appspot.com`;
    return getStorage(app).bucket(bucketName);
  } catch (error) {
    console.error("[firebase-admin] Storage unavailable:", (error as Error).message);
    return null;
  }
}

export const COLLECTIONS = {
  admins: "admins",
  kittens: "kittens",
  products: "products",
  gallery: "gallery",
} as const;
