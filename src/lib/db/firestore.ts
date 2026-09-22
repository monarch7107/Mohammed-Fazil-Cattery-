import "server-only";

import { FieldValue, type DocumentData } from "firebase-admin/firestore";
import type {
  AdminUser,
  GalleryItem,
  Kitten,
  Product,
} from "@/models/types";
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
import { COLLECTIONS, firestore } from "@/lib/firebase/admin";

/**
 * Firestore implementation of the DataStore contract.
 *
 * The public site, the API routes and the admin panel only ever talk to the
 * DataStore interface — replacing the previous store with Firestore touched
 * no component.
 *
 * Documents map 1:1 to the domain shapes in src/models/types.ts. Writes go
 * through zod validation first (src/lib/validation.ts), so this layer trusts
 * the payload and focuses on persistence semantics.
 */

type Doc = DocumentData;

const toIso = (value: unknown): string => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
};

const isTimestampLike = (value: unknown) =>
  value instanceof Date ||
  (value && typeof value === "object" && "toDate" in (value as object));

function mapKitten(id: string, doc: Doc): Kitten {
  return {
    id,
    name: String(doc.name ?? ""),
    breed: String(doc.breed ?? "Persian"),
    gender: (doc.gender as Kitten["gender"]) ?? "unknown",
    dateOfBirth: typeof doc.dateOfBirth === "string" ? doc.dateOfBirth : null,
    description: String(doc.description ?? ""),
    status: (doc.status as Kitten["status"]) ?? "available",
    price: typeof doc.price === "number" ? doc.price : null,
    images: Array.isArray(doc.images) ? doc.images.filter((v: unknown): v is string => Boolean(v)) : [],
    featured: Boolean(doc.featured),
    placeholder: Boolean(doc.placeholder),
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt ?? doc.createdAt),
  };
}

function mapProduct(id: string, doc: Doc): Product {
  return {
    id,
    name: String(doc.name ?? ""),
    animal: (doc.animal as Product["animal"]) ?? "cat",
    category: (doc.category as Product["category"]) ?? "dry",
    foodType: typeof doc.foodType === "string" ? doc.foodType : "",
    brand: typeof doc.brand === "string" ? doc.brand : null,
    packSize: typeof doc.packSize === "string" ? doc.packSize : null,
    price: typeof doc.price === "number" ? doc.price : null,
    description: typeof doc.description === "string" ? doc.description : "",
    image: typeof doc.image === "string" ? doc.image : null,
    available: doc.available !== false,
    placeholder: Boolean(doc.placeholder),
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt ?? doc.createdAt),
  };
}

function mapGallery(id: string, doc: Doc): GalleryItem {
  return {
    id,
    image: typeof doc.image === "string" ? doc.image : null,
    category: (doc.category as GalleryItem["category"]) ?? "cattery",
    caption: typeof doc.caption === "string" ? doc.caption : "",
    sortOrder: typeof doc.sortOrder === "number" ? doc.sortOrder : 0,
    placeholder: Boolean(doc.placeholder),
    createdAt: toIso(doc.createdAt),
  };
}

/** Strip undefined values (Firestore rejects them). */
function prune<T extends object>(input: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).filter(([, v]) => v !== undefined)
  );
}

/* ------------------------------------------------------------------ */
/* Optional first-run seeding (clearly-labelled placeholders)          */
/* ------------------------------------------------------------------ */

const globalRef = globalThis as typeof globalThis & { __mfcFsSeeded?: boolean };

async function seedIfEmpty(db: NonNullable<ReturnType<typeof firestore>>): Promise<void> {
  if (globalRef.__mfcFsSeeded) return;
  if (process.env.SEED_ON_EMPTY === "false") {
    globalRef.__mfcFsSeeded = true;
    return;
  }

  const snapshot = await db
    .collection(COLLECTIONS.kittens)
    .count()
    .get()
    .then((r) => r.data().count)
    .catch(() => 0);

  const products = await db
    .collection(COLLECTIONS.products)
    .count()
    .get()
    .then((r) => r.data().count)
    .catch(() => 0);

  const gallery = await db
    .collection(COLLECTIONS.gallery)
    .count()
    .get()
    .then((r) => r.data().count)
    .catch(() => 0);

  if (snapshot === 0 && products === 0 && gallery === 0) {
    const batch = db.batch();
    const nowIso = new Date().toISOString();
    placeholderKittens().forEach((kitten) => {
      const { id, ...rest } = kitten;
      void id;
      batch.set(db.collection(COLLECTIONS.kittens).doc(), { ...rest, placeholder: true, createdAt: nowIso, updatedAt: nowIso });
    });
    placeholderProducts().forEach((product) => {
      const { id, ...rest } = product;
      void id;
      batch.set(db.collection(COLLECTIONS.products).doc(), { ...rest, placeholder: true, createdAt: nowIso, updatedAt: nowIso });
    });
    placeholderGallery().forEach((item) => {
      const { id, ...rest } = item;
      void id;
      batch.set(db.collection(COLLECTIONS.gallery).doc(), { ...rest, placeholder: true, createdAt: nowIso });
    });
    await batch.commit();
  }

  globalRef.__mfcFsSeeded = true;
}

async function ready() {
  const db = firestore();
  if (!db) throw new Error("Firebase Admin SDK is not configured");
  await seedIfEmpty(db);
  return db;
}

/* ------------------------------------------------------------------ */
/* Store implementation                                                */
/* ------------------------------------------------------------------ */

export const firestoreStore: DataStore = {
  mode: "firebase",

  async listKittens(filter: ListKittenFilter = {}) {
    const db = await ready();
    let query = db.collection(COLLECTIONS.kittens).orderBy("createdAt", "desc") as any;
    if (filter.status) query = query.where("status", "==", filter.status);
    if (filter.featured) query = query.where("featured", "==", true);
    const snapshot = await query.get();
    return snapshot.docs.map((doc: { id: string; data: () => Doc }) => mapKitten(doc.id, doc.data()));
  },

  async getKitten(id) {
    const db = await ready();
    const doc = await db.collection(COLLECTIONS.kittens).doc(id).get();
    return doc.exists ? mapKitten(doc.id, doc.data() ?? {}) : null;
  },

  async createKitten(input) {
    const db = await ready();
    const nowIso = new Date().toISOString();
    const ref = db.collection(COLLECTIONS.kittens).doc();
    const doc = prune({ ...input, placeholder: false, createdAt: nowIso, updatedAt: nowIso });
    await ref.set(doc);
    return mapKitten(ref.id, doc);
  },

  async updateKitten(id, input) {
    const db = await ready();
    const ref = db.collection(COLLECTIONS.kittens).doc(id);
    const doc = await ref.get();
    if (!doc.exists) return null;
    const patch = prune({ ...input, updatedAt: new Date().toISOString() });
    await ref.set(patch, { merge: true });
    const updated = await ref.get();
    return mapKitten(updated.id, updated.data() ?? {});
  },

  async deleteKitten(id) {
    const db = await ready();
    const result = await db.collection(COLLECTIONS.kittens).doc(id).delete();
    return Boolean(result.writeTime);
  },

  async listProducts(filter: ListProductFilter = {}) {
    const db = await ready();
    let query = db.collection(COLLECTIONS.products).orderBy("createdAt", "desc") as any;
    if (filter.animal) query = query.where("animal", "==", filter.animal);
    if (filter.category) query = query.where("category", "==", filter.category);
    const snapshot = await query.get();
    return snapshot.docs.map((doc: { id: string; data: () => Doc }) => mapProduct(doc.id, doc.data()));
  },

  async getProduct(id) {
    const db = await ready();
    const doc = await db.collection(COLLECTIONS.products).doc(id).get();
    return doc.exists ? mapProduct(doc.id, doc.data() ?? {}) : null;
  },

  async createProduct(input) {
    const db = await ready();
    const nowIso = new Date().toISOString();
    const ref = db.collection(COLLECTIONS.products).doc();
    const doc = prune({ ...input, placeholder: false, createdAt: nowIso, updatedAt: nowIso });
    await ref.set(doc);
    return mapProduct(ref.id, doc);
  },

  async updateProduct(id, input) {
    const db = await ready();
    const ref = db.collection(COLLECTIONS.products).doc(id);
    const doc = await ref.get();
    if (!doc.exists) return null;
    const patch = prune({ ...input, updatedAt: new Date().toISOString() });
    await ref.set(patch, { merge: true });
    const updated = await ref.get();
    return mapProduct(updated.id, updated.data() ?? {});
  },

  async deleteProduct(id) {
    const db = await ready();
    const result = await db.collection(COLLECTIONS.products).doc(id).delete();
    return Boolean(result.writeTime);
  },

  async listGallery(filter: ListGalleryFilter = {}) {
    const db = await ready();
    let query = db.collection(COLLECTIONS.gallery).orderBy("sortOrder", "asc") as any;
    if (filter.category) query = query.where("category", "==", filter.category);
    const snapshot = await query.get();
    const items = snapshot.docs.map((doc: { id: string; data: () => Doc }) => mapGallery(doc.id, doc.data()));
    return items.sort((a: GalleryItem, b: GalleryItem) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return b.createdAt.localeCompare(a.createdAt);
    });
  },

  async getGalleryItem(id) {
    const db = await ready();
    const doc = await db.collection(COLLECTIONS.gallery).doc(id).get();
    return doc.exists ? mapGallery(doc.id, doc.data() ?? {}) : null;
  },

  async createGallery(input) {
    const db = await ready();
    const ref = db.collection(COLLECTIONS.gallery).doc();
    const doc = prune({ ...input, placeholder: false, createdAt: new Date().toISOString() });
    await ref.set(doc);
    return mapGallery(ref.id, doc);
  },

  async updateGallery(id, patch) {
    const db = await ready();
    const ref = db.collection(COLLECTIONS.gallery).doc(id);
    const doc = await ref.get();
    if (!doc.exists) return null;
    await ref.set(prune(patch), { merge: true });
    const updated = await ref.get();
    return mapGallery(updated.id, updated.data() ?? {});
  },

  async deleteGallery(id) {
    const db = await ready();
    const result = await db.collection(COLLECTIONS.gallery).doc(id).delete();
    return Boolean(result.writeTime);
  },

  async reorderGallery(orderedIds) {
    const db = await ready();
    const batch = db.batch();
    orderedIds.forEach((id, index) => {
      batch.set(
        db.collection(COLLECTIONS.gallery).doc(id),
        { sortOrder: index },
        { merge: true }
      );
    });
    await batch.commit();
    return orderedIds.length > 0;
  },

  /**
   * Admin lookup is a no-op in the Firebase architecture: authentication is
   * delegated to Firebase Auth and authorisation to the `admins` collection
   * (see lib/firebase/authorization.ts). Returning null keeps the legacy
   * password path inert while the interface stays stable.
   */
  async findAdminByEmail() {
    return null;
  },

  async ensureAdmin(user: Omit<AdminUser, "id">) {
    const db = await ready();
    const admins = db.collection(COLLECTIONS.admins);
    const existing = await admins.where("email", "==", user.email.toLowerCase()).limit(1).get();
    if (!existing.empty) {
      const doc = existing.docs[0];
      return {
        id: doc.id,
        email: String(doc.data().email ?? user.email),
        name: String(doc.data().name ?? user.name),
        passwordHash: "",
        role: "admin" as const,
        createdAt: toIso(doc.data().createdAt),
      };
    }
    const ref = admins.doc();
    await ref.set({
      email: user.email.toLowerCase(),
      name: user.name,
      role: "admin",
      active: true,
      createdAt: FieldValue.serverTimestamp(),
    });
    return {
      id: ref.id,
      email: user.email.toLowerCase(),
      name: user.name,
      passwordHash: "",
      role: "admin" as const,
      createdAt: new Date().toISOString(),
    };
  },

  async stats() {
    const db = await ready();
    const counter = (collection: string) =>
      db
        .collection(collection)
        .count()
        .get()
        .then((r) => r.data().count)
        .catch(() => 0);

    const [kittens, products, gallery] = await Promise.all([
      counter(COLLECTIONS.kittens),
      counter(COLLECTIONS.products),
      counter(COLLECTIONS.gallery),
    ]);

    const byStatus = async (status: string) => {
      try {
        const r = await db.collection(COLLECTIONS.kittens).where("status", "==", status).count().get();
        return r.data().count;
      } catch {
        return 0;
      }
    };

    const [availableKittens, reservedKittens, soldKittens, availableProducts] = await Promise.all([
      byStatus("available"),
      byStatus("reserved"),
      byStatus("sold"),
      db
        .collection(COLLECTIONS.products)
        .where("available", "==", true)
        .count()
        .get()
        .then((r) => r.data().count)
        .catch(() => 0),
    ]);

    return {
      kittens,
      availableKittens,
      reservedKittens,
      soldKittens,
      products,
      availableProducts,
      gallery,
    };
  },
};
