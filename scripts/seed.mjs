#!/usr/bin/env node
/**
 * Seed Firestore with clearly-labelled placeholder content.
 *
 * Requires FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.
 * Use --force only when you intentionally want to replace the three public
 * content collections with fresh placeholders.
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();

if (!projectId || !clientEmail || !privateKey) {
  console.error("\nFirebase is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.\n");
  process.exit(1);
}

if (getApps().length === 0) {
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
}

const db = getFirestore();
const force = process.argv.includes("--force");
const timestamp = Timestamp.now();

const kittens = [
  { name: "Persian Kitten — Placeholder 01", status: "available", gender: "male", featured: true },
  { name: "Persian Kitten — Placeholder 02", status: "available", gender: "female", featured: true },
  { name: "Persian Kitten — Placeholder 03", status: "reserved", gender: "unknown", featured: false },
  { name: "Persian Kitten — Placeholder 04", status: "sold", gender: "male", featured: false },
].map((entry) => ({
  ...entry,
  breed: "Persian",
  dateOfBirth: null,
  description: "Placeholder record. Replace it from Admin → Kittens with the real kitten details, photographs and availability.",
  price: null,
  images: [],
  placeholder: true,
  createdAt: timestamp,
  updatedAt: timestamp,
}));

const products = [
  { name: "Cat Food — Placeholder (Dry)", animal: "cat", category: "dry" },
  { name: "Cat Food — Placeholder (Wet)", animal: "cat", category: "wet" },
  { name: "Dog Food — Placeholder (Dry)", animal: "dog", category: "dry" },
  { name: "Dog Food — Placeholder (Wet)", animal: "dog", category: "wet" },
].map((entry) => ({
  ...entry,
  foodType: entry.category === "dry" ? "Dry Food" : "Wet Food",
  brand: null,
  packSize: null,
  price: null,
  description: "Placeholder record. Replace it from Admin → Products with the real brand, pack size and price when stocked.",
  image: null,
  available: true,
  placeholder: true,
  createdAt: timestamp,
  updatedAt: timestamp,
}));

const gallery = [
  ["kittens", "Kitten Photo — Placeholder"],
  ["cats", "Persian Cat Image — Placeholder"],
  ["pet-food", "Pet Food Product — Placeholder"],
  ["cattery", "Cattery Photo — Placeholder"],
  ["kittens", "Kitten Photo — Placeholder"],
  ["cats", "Persian Cat Image — Placeholder"],
].map(([category, caption], index) => ({
  category,
  caption,
  image: null,
  sortOrder: index,
  placeholder: true,
  createdAt: timestamp,
}));

async function seedCollection(name, records) {
  const collection = db.collection(name);
  const existing = await collection.limit(1).get();
  if (!force && !existing.empty) {
    console.log(`• ${name} already contains data — skipped`);
    return;
  }
  if (force) {
    const all = await collection.get();
    const deleteBatch = db.batch();
    all.docs.forEach((doc) => deleteBatch.delete(doc.ref));
    if (!all.empty) await deleteBatch.commit();
  }

  const batch = db.batch();
  records.forEach((record) => batch.set(collection.doc(), record));
  await batch.commit();
  console.log(`✓ ${records.length} placeholder ${name} seeded`);
}

try {
  await seedCollection("kittens", kittens);
  await seedCollection("products", products);
  await seedCollection("gallery", gallery);
  console.log("\nFirestore seed complete.\n");
} catch (error) {
  console.error("\nSeeding failed:", error.message, "\n");
  process.exitCode = 1;
}
