#!/usr/bin/env node
/**
 * Seed MongoDB:
 *   1. an admin user (from ADMIN_EMAIL / ADMIN_PASSWORD_HASH)
 *   2. clearly-labelled placeholder kittens, products and gallery entries
 *      (only when the collections are empty, unless --force)
 *
 *   MONGODB_URI="mongodb+srv://..." node scripts/seed.mjs [--force]
 */
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("\nMONGODB_URI is not set. Copy env.example to .env.local and fill it in.\n");
  process.exit(1);
}

const dbName = process.env.MONGODB_DB || "mohammed_fazil_cattery";
const force = process.argv.includes("--force");
const email = (process.env.ADMIN_EMAIL || "admin@mohammedfazilcattery.local").toLowerCase();
const passwordHash = process.env.ADMIN_PASSWORD_HASH;

const now = () => new Date();

const placeholderKittens = [
  { name: "Persian Kitten — Placeholder 01", status: "available", gender: "male", featured: true },
  { name: "Persian Kitten — Placeholder 02", status: "available", gender: "female", featured: true },
  { name: "Persian Kitten — Placeholder 03", status: "reserved", gender: "unknown", featured: false },
  { name: "Persian Kitten — Placeholder 04", status: "sold", gender: "male", featured: false },
].map((entry) => ({
  ...entry,
  _id: new ObjectId(),
  breed: "Persian",
  dateOfBirth: null,
  description:
    "Placeholder record. Replace it from Admin → Kittens with the real kitten details, photographs and availability.",
  price: null,
  images: [],
  placeholder: true,
  createdAt: now(),
  updatedAt: now(),
}));

const placeholderProducts = [
  { name: "Cat Food — Placeholder (Dry)", animal: "cat", category: "dry" },
  { name: "Cat Food — Placeholder (Wet)", animal: "cat", category: "wet" },
  { name: "Dog Food — Placeholder (Dry)", animal: "dog", category: "dry" },
  { name: "Dog Food — Placeholder (Wet)", animal: "dog", category: "wet" },
].map((entry) => ({
  ...entry,
  _id: new ObjectId(),
  foodType: entry.category === "dry" ? "Dry Food" : "Wet Food",
  brand: null,
  packSize: null,
  price: null,
  description:
    "Placeholder record. Replace it from Admin → Products with the real brand, pack size and price when you stock it.",
  image: null,
  available: true,
  placeholder: true,
  createdAt: now(),
  updatedAt: now(),
}));

const placeholderGallery = [
  { category: "kittens", caption: "Kitten Photo — Placeholder" },
  { category: "cats", caption: "Persian Cat Image — Placeholder" },
  { category: "pet-food", caption: "Pet Food Product — Placeholder" },
  { category: "cattery", caption: "Cattery Photo — Placeholder" },
  { category: "kittens", caption: "Kitten Photo — Placeholder" },
  { category: "cats", caption: "Persian Cat Image — Placeholder" },
].map((entry, index) => ({
  ...entry,
  _id: new ObjectId(),
  image: null,
  sortOrder: index,
  placeholder: true,
  createdAt: now(),
}));

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });

try {
  await client.connect();
  const db = client.db(dbName);

  const [kittenCount, productCount, galleryCount, userCount] = await Promise.all([
    db.collection("kittens").estimatedDocumentCount(),
    db.collection("products").estimatedDocumentCount(),
    db.collection("gallery").estimatedDocumentCount(),
    db.collection("users").estimatedDocumentCount(),
  ]);

  if (force || kittenCount === 0) {
    if (kittenCount > 0) await db.collection("kittens").deleteMany({});
    await db.collection("kittens").insertMany(placeholderKittens);
    console.log(`✓ ${placeholderKittens.length} placeholder kittens seeded`);
  } else {
    console.log(`• kittens already present (${kittenCount}) — skipped`);
  }

  if (force || productCount === 0) {
    if (productCount > 0) await db.collection("products").deleteMany({});
    await db.collection("products").insertMany(placeholderProducts);
    console.log(`✓ ${placeholderProducts.length} placeholder products seeded`);
  } else {
    console.log(`• products already present (${productCount}) — skipped`);
  }

  if (force || galleryCount === 0) {
    if (galleryCount > 0) await db.collection("gallery").deleteMany({});
    await db.collection("gallery").insertMany(placeholderGallery);
    console.log(`✓ ${placeholderGallery.length} placeholder gallery entries seeded`);
  } else {
    console.log(`• gallery already present (${galleryCount}) — skipped`);
  }

  if (passwordHash) {
    const existing = await db.collection("users").findOne({ email });
    if (!existing) {
      await db.collection("users").insertOne({
        email,
        name: "Administrator",
        passwordHash,
        role: "admin",
        createdAt: now(),
      });
      console.log(`✓ admin user created: ${email}`);
    } else {
      console.log(`• admin user already exists: ${email}`);
    }
  } else if (userCount === 0) {
    console.log(
      "• ADMIN_PASSWORD_HASH not set — no admin user created. Run: node scripts/hash-password.mjs \"your-password\""
    );
  }

  await Promise.all([
    db.collection("kittens").createIndex({ status: 1, createdAt: -1 }),
    db.collection("products").createIndex({ animal: 1, category: 1 }),
    db.collection("gallery").createIndex({ sortOrder: 1 }),
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
  ]);
  console.log("✓ indexes ensured");

  console.log("\nSeed complete.\n");
} catch (error) {
  console.error("\nSeeding failed:", error.message, "\n");
  process.exitCode = 1;
} finally {
  await client.close();
}
