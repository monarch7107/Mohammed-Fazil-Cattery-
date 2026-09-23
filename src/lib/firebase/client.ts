/**
 * Firebase CLIENT configuration.
 *
 * These values are public identifiers (not secrets) — Firebase web API keys
 * identify the project and are safe to expose. Real authorization happens
 * server-side: Firestore rules plus the Next.js API layer.
 */

const value = (key: string): string | undefined => process.env[key]?.trim() || undefined;

/** Shape required by the Firebase web SDK's initializeApp(). */
export const firebaseClientConfig = {
  apiKey: value("NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain: value("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId: value("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: value("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: value("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId: value("NEXT_PUBLIC_FIREBASE_APP_ID"),
} as const;

export function isFirebaseClientConfigured(): boolean {
  return Boolean(
    firebaseClientConfig.apiKey &&
      firebaseClientConfig.authDomain &&
      firebaseClientConfig.projectId &&
      firebaseClientConfig.appId
  );
}

let clientAppPromise: Promise<import("firebase/app").FirebaseApp> | null = null;

/**
 * Lazily-initialised singleton for the (rare) client-side Firebase calls.
 *
 * The duplicate-initialisation guard works in both directions: it reuses the
 * SDK-wide default app when something else already created one, and the
 * module-level `clientAppPromise` cache makes every caller receive the same
 * app instance — never a second one.
 */
export function getFirebaseClientApp(): Promise<import("firebase/app").FirebaseApp> {
  if (!isFirebaseClientConfigured()) {
    return Promise.reject(new Error("Firebase client configuration is missing."));
  }
  if (!clientAppPromise) {
    clientAppPromise = import("firebase/app").then(({ getApp, initializeApp }) => {
      try {
        return getApp();
      } catch {
        return initializeApp({
          apiKey: firebaseClientConfig.apiKey!,
          authDomain: firebaseClientConfig.authDomain,
          projectId: firebaseClientConfig.projectId!,
          storageBucket: firebaseClientConfig.storageBucket,
          messagingSenderId: firebaseClientConfig.messagingSenderId,
          appId: firebaseClientConfig.appId!,
        });
      }
    });
  }
  return clientAppPromise;
}

let firestorePromise: Promise<import("firebase/firestore").Firestore> | null = null;

/**
 * Client-side Firestore handle for the same singleton app.
 *
 * Used only for browser-side reads against the public content collections;
 * every write still goes through the guarded Next.js API layer, and the
 * Firestore security rules are the final gate either way.
 */
export function getFirebaseClientFirestore(): Promise<import("firebase/firestore").Firestore> {
  if (!firestorePromise) {
    firestorePromise = Promise.all([
      getFirebaseClientApp(),
      import("firebase/firestore"),
    ]).then(([app, firestore]) => firestore.getFirestore(app));
  }
  return firestorePromise;
}
