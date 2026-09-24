import { randomUUID } from "node:crypto";
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

/**
 * Development / no-database fallback.
 *
 * Keeps the whole application functional (public pages + admin CRUD) while
 * Supabase credentials are missing or unreachable, so the site is never
 * a dead preview. Data lives in process memory: it resets on restart and is
 * never used when Supabase is configured.
 */

interface MemoryDB {
  kittens: Kitten[];
  products: Product[];
  gallery: GalleryItem[];
  users: AdminUser[];
}

function bootstrap(): MemoryDB {
  return {
    kittens: placeholderKittens(),
    products: placeholderProducts(),
    gallery: placeholderGallery(),
    users: [],
  };
}

const globalRef = globalThis as typeof globalThis & { __mfcMemoryDB?: MemoryDB };

function db(): MemoryDB {
  if (!globalRef.__mfcMemoryDB) globalRef.__mfcMemoryDB = bootstrap();
  return globalRef.__mfcMemoryDB;
}

const now = () => new Date().toISOString();
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const byNewest = <T extends { createdAt: string }>(a: T, b: T) =>
  b.createdAt.localeCompare(a.createdAt);

export const memoryStore: DataStore = {
  mode: "memory",

  async listKittens(filter: ListKittenFilter = {}) {
    let items = [...db().kittens];
    if (filter.status) items = items.filter((k) => k.status === filter.status);
    if (filter.featured) items = items.filter((k) => k.featured);
    return clone(items.sort(byNewest));
  },

  async getKitten(id) {
    const found = db().kittens.find((k) => k.id === id);
    return found ? clone(found) : null;
  },

  async createKitten(input) {
    const timestamp = now();
    const record: Kitten = {
      ...input,
      description: input.description ?? "",
      id: randomUUID(),
      placeholder: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    db().kittens.unshift(record);
    return clone(record);
  },

  async updateKitten(id, input) {
    const index = db().kittens.findIndex((k) => k.id === id);
    if (index === -1) return null;
    const updated: Kitten = {
      ...db().kittens[index],
      ...input,
      id,
      updatedAt: now(),
    };
    db().kittens[index] = updated;
    return clone(updated);
  },

  async deleteKitten(id) {
    const before = db().kittens.length;
    db().kittens = db().kittens.filter((k) => k.id !== id);
    return db().kittens.length < before;
  },

  async listProducts(filter: ListProductFilter = {}) {
    let items = [...db().products];
    if (filter.animal) items = items.filter((p) => p.animal === filter.animal);
    if (filter.category) items = items.filter((p) => p.category === filter.category);
    return clone(items.sort(byNewest));
  },

  async getProduct(id) {
    const found = db().products.find((p) => p.id === id);
    return found ? clone(found) : null;
  },

  async createProduct(input) {
    const timestamp = now();
    const record: Product = {
      ...input,
      description: input.description ?? "",
      id: randomUUID(),
      placeholder: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    db().products.unshift(record);
    return clone(record);
  },

  async updateProduct(id, input) {
    const index = db().products.findIndex((p) => p.id === id);
    if (index === -1) return null;
    const updated: Product = { ...db().products[index], ...input, id, updatedAt: now() };
    db().products[index] = updated;
    return clone(updated);
  },

  async deleteProduct(id) {
    const before = db().products.length;
    db().products = db().products.filter((p) => p.id !== id);
    return db().products.length < before;
  },

  async listGallery(filter: ListGalleryFilter = {}) {
    let items = [...db().gallery];
    if (filter.category) items = items.filter((g) => g.category === filter.category);
    return clone(items.sort((a, b) => a.sortOrder - b.sortOrder || byNewest(a, b)));
  },

  async getGalleryItem(id) {
    const found = db().gallery.find((g) => g.id === id);
    return found ? clone(found) : null;
  },

  async createGallery(input) {
    const record: GalleryItem = {
      ...input,
      caption: input.caption ?? "",
      id: randomUUID(),
      placeholder: false,
      createdAt: now(),
    };
    db().gallery.push(record);
    return clone(record);
  },

  async updateGallery(id, patch) {
    const index = db().gallery.findIndex((g) => g.id === id);
    if (index === -1) return null;
    const updated: GalleryItem = { ...db().gallery[index], ...patch, id };
    db().gallery[index] = updated;
    return clone(updated);
  },

  async deleteGallery(id) {
    const before = db().gallery.length;
    db().gallery = db().gallery.filter((g) => g.id !== id);
    return db().gallery.length < before;
  },

  async reorderGallery(orderedIds) {
    const map = new Map(db().gallery.map((item) => [item.id, item]));
    const reordered: GalleryItem[] = [];
    orderedIds.forEach((id, index) => {
      const item = map.get(id);
      if (item) {
        reordered.push({ ...item, sortOrder: index });
        map.delete(id);
      }
    });
    // Anything not mentioned keeps its relative order at the end.
    map.forEach((item) => reordered.push({ ...item, sortOrder: reordered.length }));
    db().gallery = reordered;
    return true;
  },

  async findAdminByEmail(email) {
    const found = db().users.find((u) => u.email === email.toLowerCase());
    return found ? clone(found) : null;
  },

  async ensureAdmin(user) {
    const existing = db().users.find((u) => u.email === user.email.toLowerCase());
    if (existing) return clone(existing);
    const record: AdminUser = { ...user, id: randomUUID() };
    db().users.push(record);
    return clone(record);
  },

  async stats() {
    const kittens = db().kittens;
    const products = db().products;
    return {
      kittens: kittens.length,
      availableKittens: kittens.filter((k) => k.status === "available").length,
      reservedKittens: kittens.filter((k) => k.status === "reserved").length,
      soldKittens: kittens.filter((k) => k.status === "sold").length,
      products: products.length,
      availableProducts: products.filter((p) => p.available).length,
      gallery: db().gallery.length,
    };
  },
};
