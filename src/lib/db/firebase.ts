import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { FieldValue, getFirestore, type Firestore, Timestamp } from "firebase-admin/firestore";
import type { AdminUser, GalleryItem, Kitten, Product } from "@/models/types";
import type {
  DataStore,
  ListGalleryFilter,
  ListKittenFilter,
  ListProductFilter,
} from "@/lib/db/types";
import {
  placeholderGallery,
  placeholderKittens,
  placeholderProducts,
} from "@/lib/db/placeholder-data";

function config() {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  if (!projectId || !clientEmail || !privateKey) return null;
  return { projectId, clientEmail, privateKey };
}

export function hasFirebaseConfig(): boolean {
  return Boolean(config());
}

function getFirebaseApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;
  const credentials = config();
  if (!credentials) {
    throw new Error(
      "Firebase is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY."
    );
  }
  return initializeApp({
    credential: cert(credentials),
    projectId: credentials.projectId,
  });
}

let firestore: Firestore | null = null;
function db(): Firestore {
  if (!firestore) firestore = getFirestore(getFirebaseApp());
  return firestore;
}

type Doc = Record<string, unknown>;

function iso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

function mapKitten(id: string, doc: Doc): Kitten {
  return {
    id,
    name: String(doc.name ?? ""),
    breed: String(doc.breed ?? "Persian"),
    gender: (doc.gender as Kitten["gender"]) ?? "unknown",
    dateOfBirth: doc.dateOfBirth ? iso(doc.dateOfBirth).slice(0, 10) : null,
    description: String(doc.description ?? ""),
    status: (doc.status as Kitten["status"]) ?? "available",
    price: typeof doc.price === "number" ? doc.price : null,
    images: Array.isArray(doc.images) ? doc.images.filter(Boolean).map(String) : [],
    featured: Boolean(doc.featured),
    placeholder: Boolean(doc.placeholder),
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

function mapProduct(id: string, doc: Doc): Product {
  return {
    id,
    name: String(doc.name ?? ""),
    animal: (doc.animal as Product["animal"]) ?? "cat",
    category: (doc.category as Product["category"]) ?? "dry",
    foodType: String(doc.foodType ?? ""),
    brand: typeof doc.brand === "string" ? doc.brand : null,
    packSize: typeof doc.packSize === "string" ? doc.packSize : null,
    price: typeof doc.price === "number" ? doc.price : null,
    description: String(doc.description ?? ""),
    image: typeof doc.image === "string" ? doc.image : null,
    available: doc.available !== false,
    placeholder: Boolean(doc.placeholder),
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

function mapGallery(id: string, doc: Doc): GalleryItem {
  return {
    id,
    image: typeof doc.image === "string" ? doc.image : null,
    category: (doc.category as GalleryItem["category"]) ?? "cattery",
    caption: String(doc.caption ?? ""),
    sortOrder: typeof doc.sortOrder === "number" ? doc.sortOrder : 0,
    placeholder: Boolean(doc.placeholder),
    createdAt: iso(doc.createdAt),
  };
}

async function seedIfEmpty(): Promise<void> {
  if (process.env.SEED_ON_EMPTY === "false") return;
  const firestoreDb = db();
  const [kittens, products, gallery] = await Promise.all([
    firestoreDb.collection("kittens").limit(1).get(),
    firestoreDb.collection("products").limit(1).get(),
    firestoreDb.collection("gallery").limit(1).get(),
  ]);
  if (!kittens.empty || !products.empty || !gallery.empty) return;

  const batch = firestoreDb.batch();
  const timestamp = Timestamp.now();

  for (const kitten of placeholderKittens()) {
    const ref = firestoreDb.collection("kittens").doc();
    const { id: _id, ...record } = kitten;
    void _id;
    batch.set(ref, { ...record, createdAt: timestamp, updatedAt: timestamp });
  }

  for (const product of placeholderProducts()) {
    const ref = firestoreDb.collection("products").doc();
    const { id: _id, ...record } = product;
    void _id;
    batch.set(ref, { ...record, createdAt: timestamp, updatedAt: timestamp });
  }

  placeholderGallery().forEach((galleryItem, index) => {
    const ref = firestoreDb.collection("gallery").doc();
    const { id: _id, ...record } = galleryItem;
    void _id;
    batch.set(ref, { ...record, sortOrder: index, createdAt: timestamp });
  });

  await batch.commit();
}

let seeded = false;
async function ready(): Promise<Firestore> {
  const firestoreDb = db();
  if (!seeded) {
    await seedIfEmpty();
    seeded = true;
  }
  return firestoreDb;
}

export const firebaseStore: DataStore = {
  mode: "firebase",

  async listKittens(filter: ListKittenFilter = {}) {
    const snapshot = await (await ready()).collection("kittens").get();
    return snapshot.docs
      .map((doc) => mapKitten(doc.id, doc.data()))
      .filter((kitten) => !filter.status || kitten.status === filter.status)
      .filter((kitten) => !filter.featured || kitten.featured)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getKitten(id) {
    const doc = await (await ready()).collection("kittens").doc(id).get();
    return doc.exists ? mapKitten(doc.id, doc.data() as Doc) : null;
  },

  async createKitten(input) {
    const firestoreDb = await ready();
    const ref = firestoreDb.collection("kittens").doc();
    const timestamp = Timestamp.now();
    const doc = { ...input, placeholder: false, createdAt: timestamp, updatedAt: timestamp };
    await ref.set(doc);
    return mapKitten(ref.id, doc);
  },

  async updateKitten(id, input) {
    const ref = (await ready()).collection("kittens").doc(id);
    if (!(await ref.get()).exists) return null;
    await ref.update({ ...input, updatedAt: FieldValue.serverTimestamp() });
    const updated = await ref.get();
    return updated.exists ? mapKitten(updated.id, updated.data() as Doc) : null;
  },

  async deleteKitten(id) {
    const ref = (await ready()).collection("kittens").doc(id);
    if (!(await ref.get()).exists) return false;
    await ref.delete();
    return true;
  },

  async listProducts(filter: ListProductFilter = {}) {
    const snapshot = await (await ready()).collection("products").get();
    return snapshot.docs
      .map((doc) => mapProduct(doc.id, doc.data()))
      .filter((product) => !filter.animal || product.animal === filter.animal)
      .filter((product) => !filter.category || product.category === filter.category)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getProduct(id) {
    const doc = await (await ready()).collection("products").doc(id).get();
    return doc.exists ? mapProduct(doc.id, doc.data() as Doc) : null;
  },

  async createProduct(input) {
    const firestoreDb = await ready();
    const ref = firestoreDb.collection("products").doc();
    const timestamp = Timestamp.now();
    const doc = { ...input, placeholder: false, createdAt: timestamp, updatedAt: timestamp };
    await ref.set(doc);
    return mapProduct(ref.id, doc);
  },

  async updateProduct(id, input) {
    const ref = (await ready()).collection("products").doc(id);
    if (!(await ref.get()).exists) return null;
    await ref.update({ ...input, updatedAt: FieldValue.serverTimestamp() });
    const updated = await ref.get();
    return updated.exists ? mapProduct(updated.id, updated.data() as Doc) : null;
  },

  async deleteProduct(id) {
    const ref = (await ready()).collection("products").doc(id);
    if (!(await ref.get()).exists) return false;
    await ref.delete();
    return true;
  },

  async listGallery(filter: ListGalleryFilter = {}) {
    const snapshot = await (await ready()).collection("gallery").get();
    return snapshot.docs
      .map((doc) => mapGallery(doc.id, doc.data()))
      .filter((item) => !filter.category || item.category === filter.category)
      .sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt.localeCompare(a.createdAt));
  },

  async getGalleryItem(id) {
    const doc = await (await ready()).collection("gallery").doc(id).get();
    return doc.exists ? mapGallery(doc.id, doc.data() as Doc) : null;
  },

  async createGallery(input) {
    const firestoreDb = await ready();
    const ref = firestoreDb.collection("gallery").doc();
    const doc = { ...input, placeholder: false, createdAt: Timestamp.now() };
    await ref.set(doc);
    return mapGallery(ref.id, doc);
  },

  async updateGallery(id, patch) {
    const ref = (await ready()).collection("gallery").doc(id);
    if (!(await ref.get()).exists) return null;
    await ref.update(patch);
    const updated = await ref.get();
    return updated.exists ? mapGallery(updated.id, updated.data() as Doc) : null;
  },

  async deleteGallery(id) {
    const ref = (await ready()).collection("gallery").doc(id);
    if (!(await ref.get()).exists) return false;
    await ref.delete();
    return true;
  },

  async reorderGallery(orderedIds) {
    if (orderedIds.length === 0) return false;
    const firestoreDb = await ready();
    const batch = firestoreDb.batch();
    orderedIds.forEach((id, index) => {
      batch.update(firestoreDb.collection("gallery").doc(id), { sortOrder: index });
    });
    await batch.commit();
    return true;
  },

  async findAdminByEmail(email) {
    const snapshot = await (await ready())
      .collection("users")
      .where("email", "==", email.toLowerCase())
      .limit(1)
      .get();
    const doc = snapshot.docs[0];
    if (!doc) return null;
    const data = doc.data();
    return {
      id: doc.id,
      email: String(data.email),
      name: String(data.name ?? "Administrator"),
      passwordHash: String(data.passwordHash ?? ""),
      role: "admin",
      createdAt: iso(data.createdAt),
    };
  },

  async ensureAdmin(user) {
    const firestoreDb = await ready();
    const existing = await firestoreDb
      .collection("users")
      .where("email", "==", user.email.toLowerCase())
      .limit(1)
      .get();
    const found = existing.docs[0];
    if (found) {
      const data = found.data();
      return {
        id: found.id,
        email: String(data.email),
        name: String(data.name ?? "Administrator"),
        passwordHash: String(data.passwordHash ?? ""),
        role: "admin",
        createdAt: iso(data.createdAt),
      };
    }

    const ref = firestoreDb.collection("users").doc();
    const doc = { ...user, email: user.email.toLowerCase(), createdAt: Timestamp.now() };
    await ref.set(doc);
    return {
      ...user,
      id: ref.id,
      email: doc.email,
      createdAt: (doc.createdAt as Timestamp).toDate().toISOString(),
    };
  },

  async stats() {
    const firestoreDb = await ready();
    const [kittens, products, gallery] = await Promise.all([
      firestoreDb.collection("kittens").get(),
      firestoreDb.collection("products").get(),
      firestoreDb.collection("gallery").get(),
    ]);
    const kittenRows = kittens.docs.map((doc) => doc.data());
    const productRows = products.docs.map((doc) => doc.data());
    return {
      kittens: kittenRows.length,
      availableKittens: kittenRows.filter((row) => row.status === "available").length,
      reservedKittens: kittenRows.filter((row) => row.status === "reserved").length,
      soldKittens: kittenRows.filter((row) => row.status === "sold").length,
      products: productRows.length,
      availableProducts: productRows.filter((row) => row.available !== false).length,
      gallery: gallery.size,
    };
  },
};
