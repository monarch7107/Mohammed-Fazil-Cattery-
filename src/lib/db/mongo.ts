import { ObjectId, Db, MongoClient } from "mongodb";
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

/* ------------------------------------------------------------------ */
/* Connection (cached across hot reloads)                              */
/* ------------------------------------------------------------------ */

const globalRef = globalThis as typeof globalThis & {
  __mfcMongoClient?: Promise<MongoClient>;
  __mfcMongoDb?: Promise<Db>;
  __mfcMongoSeeded?: boolean;
};

function uri(): string | null {
  const value = process.env.MONGODB_URI?.trim();
  return value ? value : null;
}

function databaseName(): string {
  return process.env.MONGODB_DB?.trim() || "mohammed_fazil_cattery";
}

export function hasMongoConfig(): boolean {
  return Boolean(uri());
}

async function connect(): Promise<Db> {
  const connection = uri();
  if (!connection) throw new Error("MONGODB_URI is not configured");

  if (!globalRef.__mfcMongoClient) {
    const client = new MongoClient(connection, {
      maxPoolSize: 5,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
    });
    globalRef.__mfcMongoClient = client.connect().catch((error) => {
      globalRef.__mfcMongoClient = undefined;
      throw error;
    });
  }

  if (!globalRef.__mfcMongoDb) {
    globalRef.__mfcMongoDb = globalRef.__mfcMongoClient.then((client) =>
      client.db(databaseName())
    );
  }

  return globalRef.__mfcMongoDb;
}

export async function getDb(): Promise<Db> {
  return connect();
}

/* ------------------------------------------------------------------ */
/* Mapping helpers                                                     */
/* ------------------------------------------------------------------ */

type Doc = Record<string, any>;

const toIso = (value: unknown): string => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
};

function mapKitten(doc: Doc): Kitten {
  return {
    id: String(doc._id),
    name: String(doc.name ?? ""),
    breed: String(doc.breed ?? "Persian"),
    gender: (doc.gender as Kitten["gender"]) ?? "unknown",
    dateOfBirth: doc.dateOfBirth ? toIso(doc.dateOfBirth).slice(0, 10) : null,
    description: String(doc.description ?? ""),
    status: (doc.status as Kitten["status"]) ?? "available",
    price: typeof doc.price === "number" ? doc.price : null,
    images: Array.isArray(doc.images) ? doc.images.filter(Boolean) : [],
    featured: Boolean(doc.featured),
    placeholder: Boolean(doc.placeholder),
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

function mapProduct(doc: Doc): Product {
  return {
    id: String(doc._id),
    name: String(doc.name ?? ""),
    animal: (doc.animal as Product["animal"]) ?? "cat",
    category: (doc.category as Product["category"]) ?? "dry",
    foodType: String(doc.foodType ?? ""),
    brand: doc.brand ?? null,
    packSize: doc.packSize ?? null,
    price: typeof doc.price === "number" ? doc.price : null,
    description: String(doc.description ?? ""),
    image: doc.image ?? null,
    available: doc.available !== false,
    placeholder: Boolean(doc.placeholder),
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

function mapGallery(doc: Doc): GalleryItem {
  return {
    id: String(doc._id),
    image: doc.image ?? null,
    category: (doc.category as GalleryItem["category"]) ?? "cattery",
    caption: String(doc.caption ?? ""),
    sortOrder: typeof doc.sortOrder === "number" ? doc.sortOrder : 0,
    placeholder: Boolean(doc.placeholder),
    createdAt: toIso(doc.createdAt),
  };
}

const isValidId = (id: string) => ObjectId.isValid(id);

/* ------------------------------------------------------------------ */
/* Optional first-run seeding                                          */
/* ------------------------------------------------------------------ */

async function seedIfEmpty(db: Db): Promise<void> {
  if (globalRef.__mfcMongoSeeded) return;
  if (process.env.SEED_ON_EMPTY === "false") {
    globalRef.__mfcMongoSeeded = true;
    return;
  }

  const [kittenCount, productCount, galleryCount] = await Promise.all([
    db.collection("kittens").estimatedDocumentCount(),
    db.collection("products").estimatedDocumentCount(),
    db.collection("gallery").estimatedDocumentCount(),
  ]);

  if (kittenCount === 0 && productCount === 0 && galleryCount === 0) {
    const timestamp = new Date();
    await Promise.all([
      db
        .collection("kittens")
        .insertMany(
          placeholderKittens().map((k) => ({
            ...k,
            _id: new ObjectId(),
            id: undefined,
            createdAt: timestamp,
            updatedAt: timestamp,
          }))
        ),
      db
        .collection("products")
        .insertMany(
          placeholderProducts().map((p) => ({
            ...p,
            _id: new ObjectId(),
            id: undefined,
            createdAt: timestamp,
            updatedAt: timestamp,
          }))
        ),
      db
        .collection("gallery")
        .insertMany(
          placeholderGallery().map((g, index) => ({
            ...g,
            _id: new ObjectId(),
            id: undefined,
            sortOrder: index,
            createdAt: timestamp,
          }))
        ),
    ]);
  }

  globalRef.__mfcMongoSeeded = true;
}

async function ready(): Promise<Db> {
  const db = await connect();
  await seedIfEmpty(db);
  return db;
}

/* ------------------------------------------------------------------ */
/* Store implementation                                                */
/* ------------------------------------------------------------------ */

export const mongoStore: DataStore = {
  mode: "mongo",

  async listKittens(filter: ListKittenFilter = {}) {
    const db = await ready();
    const query: Doc = {};
    if (filter.status) query.status = filter.status;
    if (filter.featured) query.featured = true;
    const docs = await db
      .collection("kittens")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    return docs.map(mapKitten);
  },

  async getKitten(id) {
    if (!isValidId(id)) return null;
    const db = await ready();
    const doc = await db.collection("kittens").findOne({ _id: new ObjectId(id) });
    return doc ? mapKitten(doc) : null;
  },

  async createKitten(input) {
    const db = await ready();
    const timestamp = new Date();
    const doc = { ...input, createdAt: timestamp, updatedAt: timestamp, placeholder: false };
    const result = await db.collection("kittens").insertOne(doc);
    return mapKitten({ ...doc, _id: result.insertedId });
  },

  async updateKitten(id, input) {
    if (!isValidId(id)) return null;
    const db = await ready();
    const result = await db
      .collection("kittens")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...input, updatedAt: new Date() } },
        { returnDocument: "after" }
      );
    return result ? mapKitten(result as Doc) : null;
  },

  async deleteKitten(id) {
    if (!isValidId(id)) return false;
    const db = await ready();
    const result = await db.collection("kittens").deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  },

  async listProducts(filter: ListProductFilter = {}) {
    const db = await ready();
    const query: Doc = {};
    if (filter.animal) query.animal = filter.animal;
    if (filter.category) query.category = filter.category;
    const docs = await db
      .collection("products")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    return docs.map(mapProduct);
  },

  async getProduct(id) {
    if (!isValidId(id)) return null;
    const db = await ready();
    const doc = await db.collection("products").findOne({ _id: new ObjectId(id) });
    return doc ? mapProduct(doc) : null;
  },

  async createProduct(input) {
    const db = await ready();
    const timestamp = new Date();
    const doc = { ...input, createdAt: timestamp, updatedAt: timestamp, placeholder: false };
    const result = await db.collection("products").insertOne(doc);
    return mapProduct({ ...doc, _id: result.insertedId });
  },

  async updateProduct(id, input) {
    if (!isValidId(id)) return null;
    const db = await ready();
    const result = await db
      .collection("products")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...input, updatedAt: new Date() } },
        { returnDocument: "after" }
      );
    return result ? mapProduct(result as Doc) : null;
  },

  async deleteProduct(id) {
    if (!isValidId(id)) return false;
    const db = await ready();
    const result = await db.collection("products").deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  },

  async listGallery(filter: ListGalleryFilter = {}) {
    const db = await ready();
    const query: Doc = {};
    if (filter.category) query.category = filter.category;
    const docs = await db
      .collection("gallery")
      .find(query)
      .sort({ sortOrder: 1, createdAt: -1 })
      .toArray();
    return docs.map(mapGallery);
  },

  async getGalleryItem(id) {
    if (!isValidId(id)) return null;
    const db = await ready();
    const doc = await db.collection("gallery").findOne({ _id: new ObjectId(id) });
    return doc ? mapGallery(doc) : null;
  },

  async createGallery(input) {
    const db = await ready();
    const doc = {
      ...input,
      createdAt: new Date(),
      placeholder: false,
    };
    const result = await db.collection("gallery").insertOne(doc);
    return mapGallery({ ...doc, _id: result.insertedId });
  },

  async updateGallery(id, patch) {
    if (!isValidId(id)) return null;
    const db = await ready();
    const result = await db
      .collection("gallery")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...patch } },
        { returnDocument: "after" }
      );
    return result ? mapGallery(result as Doc) : null;
  },

  async deleteGallery(id) {
    if (!isValidId(id)) return false;
    const db = await ready();
    const result = await db.collection("gallery").deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  },

  async reorderGallery(orderedIds) {
    const db = await ready();
    const ops = orderedIds
      .filter(isValidId)
      .map((id, index) => ({
        updateOne: {
          filter: { _id: new ObjectId(id) },
          update: { $set: { sortOrder: index } },
        },
      }));
    if (ops.length === 0) return false;
    await db.collection("gallery").bulkWrite(ops);
    return true;
  },

  async findAdminByEmail(email) {
    if (!hasMongoConfig()) return null;
    const db = await connect(); // never seed users from placeholders
    const doc = await db.collection("users").findOne({ email: email.toLowerCase() });
    if (!doc) return null;
    return {
      id: String(doc._id),
      email: String(doc.email),
      name: String(doc.name ?? "Administrator"),
      passwordHash: String(doc.passwordHash ?? ""),
      role: "admin",
      createdAt: toIso(doc.createdAt),
    };
  },

  async ensureAdmin(user) {
    const db = await connect();
    const email = user.email.toLowerCase();
    const existing = await db.collection("users").findOne({ email });
    if (existing) {
      return {
        id: String(existing._id),
        email: String(existing.email),
        name: String(existing.name ?? "Administrator"),
        passwordHash: String(existing.passwordHash ?? ""),
        role: "admin",
        createdAt: toIso(existing.createdAt),
      };
    }
    const doc = { ...user, email, createdAt: new Date() };
    const result = await db.collection("users").insertOne(doc);
    return {
      id: String(result.insertedId),
      email,
      name: user.name,
      passwordHash: user.passwordHash,
      role: "admin",
      createdAt: doc.createdAt.toISOString(),
    };
  },

  async stats() {
    const db = await ready();
    const [kittens, availableKittens, reservedKittens, soldKittens, products, availableProducts, gallery] =
      await Promise.all([
        db.collection("kittens").countDocuments(),
        db.collection("kittens").countDocuments({ status: "available" }),
        db.collection("kittens").countDocuments({ status: "reserved" }),
        db.collection("kittens").countDocuments({ status: "sold" }),
        db.collection("products").countDocuments(),
        db.collection("products").countDocuments({ available: true }),
        db.collection("gallery").countDocuments(),
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
