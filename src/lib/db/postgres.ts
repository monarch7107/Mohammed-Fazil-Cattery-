import "server-only";

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
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * PostgreSQL (Supabase) implementation of the DataStore contract.
 *
 * PUBLISHABLE-KEY-ONLY ARCHITECTURE: there is no privileged client and no
 * secret key. Every operation executes through the cookie-bound server
 * client, so PostgreSQL Row Level Security is the actual authorization
 * layer:
 *
 *   - public reads        → allowed by `*_public_read` policies (anon role)
 *   - admin writes        → allowed by identity-based admin policies
 *                           (auth.uid() must own an active `admins` row,
 *                           evaluated by the security-definer helper
 *                           public.is_cattery_admin())
 *   - everything else     → denied by RLS
 *
 * Authorization is therefore enforced at the database per-statement level —
 * identical for requests arriving via the Next.js API layer and for any
 * direct use of the publishable key.
 */

type KittenRow = {
  id: string;
  name: string;
  breed: string;
  gender: Kitten["gender"];
  date_of_birth: string | null;
  description: string;
  status: Kitten["status"];
  price: number | string | null;
  images: unknown;
  image_ids: unknown;
  featured: boolean;
  placeholder: boolean;
  created_at: string;
  updated_at: string;
};

type ProductRow = {
  id: string;
  name: string;
  animal: Product["animal"];
  category: Product["category"];
  food_type: string;
  brand: string | null;
  pack_size: string | null;
  price: number | string | null;
  description: string;
  image: string | null;
  image_id: string | null;
  available: boolean;
  placeholder: boolean;
  created_at: string;
  updated_at: string;
};

type GalleryRow = {
  id: string;
  image: string | null;
  image_id: string | null;
  category: GalleryItem["category"];
  caption: string;
  sort_order: number;
  placeholder: boolean;
  created_at: string;
};

const num = (value: number | string | null): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(parsed) ? parsed : null;
};

const asArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && Boolean(v)) : [];

function mapKitten(row: KittenRow): Kitten {
  return {
    id: row.id,
    name: row.name,
    breed: row.breed,
    gender: row.gender,
    dateOfBirth: row.date_of_birth,
    description: row.description,
    status: row.status,
    price: num(row.price),
    images: asArray(row.images),
    imageIds: asArray(row.image_ids),
    featured: row.featured,
    placeholder: row.placeholder,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    animal: row.animal,
    category: row.category,
    foodType: row.food_type,
    brand: row.brand,
    packSize: row.pack_size,
    price: num(row.price),
    description: row.description,
    image: row.image,
    imageId: row.image_id,
    available: row.available,
    placeholder: row.placeholder,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function mapGallery(row: GalleryRow): GalleryItem {
  return {
    id: row.id,
    image: row.image,
    imageId: row.image_id,
    category: row.category,
    caption: row.caption,
    sortOrder: row.sort_order,
    placeholder: row.placeholder,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

async function client() {
  const c = await getSupabaseServerClient();
  if (!c) {
    throw new Error(
      "Supabase is not configured — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }
  return c;
}

export const postgresStore: DataStore = {
  mode: "postgres",

  /* ------------------------------- Kittens ---------------------------- */

  async listKittens(filter: ListKittenFilter = {}) {
    const c = await client();
    let query = c.from("kittens").select("*").order("created_at", { ascending: false });
    if (filter.status) query = query.eq("status", filter.status);
    if (filter.featured) query = query.eq("featured", true);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data as KittenRow[]).map(mapKitten);
  },

  async getKitten(id) {
    const c = await client();
    const { data, error } = await c.from("kittens").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapKitten(data as KittenRow) : null;
  },

  async createKitten(input) {
    const c = await client();
    const { data, error } = await c
      .from("kittens")
      .insert({
        name: input.name,
        breed: input.breed,
        gender: input.gender,
        date_of_birth: input.dateOfBirth,
        description: input.description,
        status: input.status,
        price: input.price,
        images: input.images,
        image_ids: input.imageIds,
        featured: input.featured,
        placeholder: false,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapKitten(data as KittenRow);
  },

  async updateKitten(id, input) {
    const c = await client();
    const { data, error } = await c
      .from("kittens")
      .update({
        name: input.name,
        breed: input.breed,
        gender: input.gender,
        date_of_birth: input.dateOfBirth,
        description: input.description,
        status: input.status,
        price: input.price,
        images: input.images,
        image_ids: input.imageIds,
        featured: input.featured,
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapKitten(data as KittenRow) : null;
  },

  async deleteKitten(id) {
    const c = await client();
    const { data, error } = await c
      .from("kittens")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return Boolean(data);
  },

  /* ------------------------------ Products ---------------------------- */

  async listProducts(filter: ListProductFilter = {}) {
    const c = await client();
    let query = c.from("products").select("*").order("created_at", { ascending: false });
    if (filter.animal) query = query.eq("animal", filter.animal);
    if (filter.category) query = query.eq("category", filter.category);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data as ProductRow[]).map(mapProduct);
  },

  async getProduct(id) {
    const c = await client();
    const { data, error } = await c.from("products").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapProduct(data as ProductRow) : null;
  },

  async createProduct(input) {
    const c = await client();
    const { data, error } = await c
      .from("products")
      .insert({
        name: input.name,
        animal: input.animal,
        category: input.category,
        food_type: input.foodType,
        brand: input.brand,
        pack_size: input.packSize,
        price: input.price,
        description: input.description,
        image: input.image,
        image_id: input.imageId,
        available: input.available,
        placeholder: false,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapProduct(data as ProductRow);
  },

  async updateProduct(id, input) {
    const c = await client();
    const { data, error } = await c
      .from("products")
      .update({
        name: input.name,
        animal: input.animal,
        category: input.category,
        food_type: input.foodType,
        brand: input.brand,
        pack_size: input.packSize,
        price: input.price,
        description: input.description,
        image: input.image,
        image_id: input.imageId,
        available: input.available,
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapProduct(data as ProductRow) : null;
  },

  async deleteProduct(id) {
    const c = await client();
    const { data, error } = await c
      .from("products")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return Boolean(data);
  },

  /* ------------------------------- Gallery ---------------------------- */

  async listGallery(filter: ListGalleryFilter = {}) {
    const c = await client();
    let query = c.from("gallery").select("*").order("sort_order", { ascending: true });
    if (filter.category) query = query.eq("category", filter.category);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    const items = (data as GalleryRow[]).map(mapGallery);
    return items.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return b.createdAt.localeCompare(a.createdAt);
    });
  },

  async getGalleryItem(id) {
    const c = await client();
    const { data, error } = await c.from("gallery").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapGallery(data as GalleryRow) : null;
  },

  async createGallery(input) {
    const c = await client();
    const { data, error } = await c
      .from("gallery")
      .insert({
        image: input.image,
        image_id: input.imageId,
        category: input.category,
        caption: input.caption,
        sort_order: input.sortOrder,
        placeholder: false,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapGallery(data as GalleryRow);
  },

  async updateGallery(id, patch) {
    const c = await client();
    const update: Record<string, unknown> = {};
    if (patch.image !== undefined) update.image = patch.image;
    if (patch.category !== undefined) update.category = patch.category;
    if (patch.caption !== undefined) update.caption = patch.caption;
    if (patch.sortOrder !== undefined) update.sort_order = patch.sortOrder;

    const { data, error } = await c
      .from("gallery")
      .update(update)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapGallery(data as GalleryRow) : null;
  },

  async deleteGallery(id) {
    const c = await client();
    const { data, error } = await c
      .from("gallery")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return Boolean(data);
  },

  async reorderGallery(orderedIds) {
    const c = await client();
    // One update per id; Supabase JS has no multi-row batched update with
    // per-row values, and the gallery is small (≤500 items by schema).
    const results = await Promise.all(
      orderedIds.map((id, index) =>
        c.from("gallery").update({ sort_order: index }).eq("id", id)
      )
    );
    const failed = results.find((result) => result.error);
    if (failed?.error) throw new Error(failed.error.message);
    return orderedIds.length > 0;
  },

  /* ------------------------------- Admins ----------------------------- */

  /**
   * Legacy interface placeholder. Admin authorization is identity-based via
   * Supabase Auth + the `admins` table + RLS (see src/lib/supabase/server.ts
   * and supabase/schema.sql). No password hashes exist anywhere.
   */
  async findAdminByEmail() {
    return null;
  },

  async ensureAdmin() {
    return null;
  },

  /* -------------------------------- Stats ----------------------------- */

  async stats() {
    const c = await client();
    const counter = async (table: string, column?: string, value?: unknown) => {
      let query = c.from(table).select("id", { count: "exact", head: true });
      if (column && value !== undefined) query = query.eq(column, value);
      const { count } = await query;
      return count ?? 0;
    };

    const [kittens, availableKittens, reservedKittens, soldKittens, products, availableProducts, gallery] =
      await Promise.all([
        counter("kittens"),
        counter("kittens", "status", "available"),
        counter("kittens", "status", "reserved"),
        counter("kittens", "status", "sold"),
        counter("products"),
        counter("products", "available", true),
        counter("gallery"),
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
