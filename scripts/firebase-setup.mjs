#!/usr/bin/env node
/**
 * Firebase setup for Mohammed Fazil Cattery.
 *
 * Creates/updates EXACTLY the provided admin accounts and seeds starter content.
 * The two production admin users already exist in Firebase Authentication —
 * pass their emails with matching passwords only to refresh credentials or
 * claims; the script never creates duplicates (it updates by email lookup).
 * Run it once, locally, with server credentials — never in CI or on deploy.
 *
 *   FIREBASE_PROJECT_ID=... FIREBASE_CLIENT_EMAIL=... FIREBASE_PRIVATE_KEY="..." \
 *   ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="..." \
 *   OWNER_EMAIL="owner@example.com" OWNER_PASSWORD="..." \
 *   npm run firebase-setup
 *
 * Passwords can also be passed as --admin-password / --owner-password.
 */
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const arg = (name) => {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 ? process.argv[index + 1] : undefined;
};

const env = (key) => process.env[key]?.trim();

const projectId = env("FIREBASE_PROJECT_ID");
const clientEmail = env("FIREBASE_CLIENT_EMAIL");
const privateKeyRaw = env("FIREBASE_PRIVATE_KEY");

if (!projectId || !clientEmail || !privateKeyRaw) {
  console.error(
    "\nMissing Firebase Admin credentials.\n" +
      "Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY\n" +
      "(Firebase Console → Project settings → Service accounts → Generate new private key).\n"
  );
  process.exit(1);
}

const privateKey = privateKeyRaw.includes("\\n")
  ? privateKeyRaw.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n")
  : privateKeyRaw;

initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) }, "mfc-setup");

const accounts = [
  { label: "Admin 1 (Administrator)", email: env("ADMIN_EMAIL") ?? arg("admin-email"), password: env("ADMIN_PASSWORD") ?? arg("admin-password") },
  { label: "Admin 2 (Owner)", email: env("OWNER_EMAIL") ?? arg("owner-email"), password: env("OWNER_PASSWORD") ?? arg("owner-password") },
].filter((account) => account.email && account.password);

if (accounts.length === 0) {
  console.error(
    "\nNo admin accounts provided.\n" +
      "Set ADMIN_EMAIL + ADMIN_PASSWORD and OWNER_EMAIL + OWNER_PASSWORD\n" +
      "(or pass --admin-email/--admin-password/--owner-email/--owner-password).\n" +
      "Passwords are used at run time only — they are never stored in the repo.\n"
  );
  process.exit(1);
}

const seedContent = !process.argv.includes("--no-seed") && env("SEED_ON_EMPTY") !== "false";

const db = getFirestore();
const auth = getAuth();

const uidByEmail = new Map();

/* ---------------- 1 + 2 + 3: the two admin accounts ---------------- */

for (const account of accounts) {
  const email = account.email.trim().toLowerCase();
  let user;

  try {
    user = await auth.getUserByEmail(email);
    console.log(`• ${account.label}: ${email} already exists — updating password + claim`);
  } catch {
    user = await auth.createUser({ email, password: account.password, emailVerified: true });
    console.log(`✓ ${account.label}: created ${email}`);
  }

  await auth.updateUser(user.uid, { password: account.password, emailVerified: true });
  await auth.setCustomUserClaims(user.uid, { admin: true });

  await db.collection("admins").doc(user.uid).set(
    {
      uid: user.uid,
      email,
      role: "admin",
      active: true,
      createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime) : new Date(),
      updatedAt: new Date(),
    },
    { merge: true }
  );

  uidByEmail.set(email, user.uid);
  console.log(`✓ ${account.label}: admin claim + admins/${user.uid} document ready`);
}

/* ---------------- 4: optional placeholder content ------------------ */

const nowIso = new Date().toISOString();

const placeholderKittens = [
  { name: "Persian Kitten — Placeholder 01", status: "available", gender: "male", featured: true },
  { name: "Persian Kitten — Placeholder 02", status: "available", gender: "female", featured: true },
  { name: "Persian Kitten — Placeholder 03", status: "reserved", gender: "unknown", featured: false },
  { name: "Persian Kitten — Placeholder 04", status: "sold", gender: "male", featured: false },
];

const placeholderProducts = [
  { name: "Cat Food — Placeholder (Dry)", animal: "cat", category: "dry" },
  { name: "Cat Food — Placeholder (Wet)", animal: "cat", category: "wet" },
  { name: "Dog Food — Placeholder (Dry)", animal: "dog", category: "dry" },
  { name: "Dog Food — Placeholder (Wet)", animal: "dog", category: "wet" },
];

const placeholderGallery = [
  { category: "kittens", caption: "Kitten Photo — Placeholder" },
  { category: "cats", caption: "Persian Cat Image — Placeholder" },
  { category: "pet-food", caption: "Pet Food Product — Placeholder" },
  { category: "cattery", caption: "Cattery Photo — Placeholder" },
  { category: "kittens", caption: "Kitten Photo — Placeholder" },
  { category: "cats", caption: "Persian Cat Image — Placeholder" },
];

if (seedContent) {
  const count = async (collection) => {
    const snapshot = await db.collection(collection).count().get();
    return snapshot.data().count;
  };

  if ((await count("kittens")) === 0) {
    const batch = db.batch();
    placeholderKittens.forEach((kitten) => {
      batch.set(db.collection("kittens").doc(), {
        ...kitten,
        breed: "Persian",
        dateOfBirth: null,
        description: "Placeholder record. Replace it from Admin → Kittens with the real kitten details.",
        price: null,
        images: [],
        placeholder: true,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    });
    await batch.commit();
    console.log(`✓ kittens: ${placeholderKittens.length} placeholder records seeded`);
  } else {
    console.log("• kittens already present — skipped");
  }

  if ((await count("products")) === 0) {
    const batch = db.batch();
    placeholderProducts.forEach((product) => {
      batch.set(db.collection("products").doc(), {
        ...product,
        foodType: product.category === "dry" ? "Dry Food" : "Wet Food",
        brand: null,
        packSize: null,
        price: null,
        description: "Placeholder record. Replace it from Admin → Products with the real details.",
        image: null,
        available: true,
        placeholder: true,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    });
    await batch.commit();
    console.log(`✓ products: ${placeholderProducts.length} placeholder records seeded`);
  } else {
    console.log("• products already present — skipped");
  }

  if ((await count("gallery")) === 0) {
    const batch = db.batch();
    placeholderGallery.forEach((entry, index) => {
      batch.set(db.collection("gallery").doc(), {
        ...entry,
        image: null,
        sortOrder: index,
        placeholder: true,
        createdAt: nowIso,
      });
    });
    await batch.commit();
    console.log(`✓ gallery: ${placeholderGallery.length} placeholder records seeded`);
  } else {
    console.log("• gallery already present — skipped");
  }
}  console.log(
    "\nFirebase setup complete.\n" +
      "Both accounts can now sign in at /admin and manage the site.\n" +
      "Remember to deploy the security rules: firebase deploy --only firestore:rules,firestore:indexes\n"
  );
