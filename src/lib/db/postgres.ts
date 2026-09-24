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
import {
  placeholderGallery,
  placeholderKittens,
  placeholderProducts,
} from "@/lib/db/placeholder-data";
import { supabaseAdmin, type SupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * PostgreSQL (Supabase) implementation of the DataStore contract.
 *
 * The public site, the API routes and the admin panel only ever talk to the
 * DataStore interface — swapping the underlying store touches no component.
 *
 * Every operation goes through the privileged server client so the Next.js
 * API layer (session cookie + admin authorization) remains the security gate;
 * the identical RLS policies in supabase/schema.sql protect direct public
 * table access.
 */

const globalRef = globalThis as typeof globalThis & { __mfcPgSeeded?: boolean };

type KittenRow = {
  id: string;
  name: string;
  breed: string;
  gender: Kitten["gender"];
  date_of_birth: string | null;
  description: string;
  status: Kitten["status"];
  price: number | string | null;
  images: string[];
  image_ids: string[];
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

async function ready(): Promise<SupabaseAdminClient> {
  const client = supabaseAdmin();
  if (!client) {
    throw new Error(
      "Supabase is not configured — set NEXT_PUBLIC_SUPABASE_URL plus a server-only SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY)."
    );
  }
  await seedIfEmpty(client);
  return client;
}

/** First-run seeding (clearly-labelled placeholders), mirroring previous stores. */
async function seedIfEmpty(client: SupabaseAdminClient): Promise<void> {
  if (globalRef.__mfcPgSeeded) return;
  if (process.env.SEED_ON_EMPTY === "false") {
    globalRef.__mfcPgSeeded = true;
    return;
  }

  try {
    const count = async (table: "kittens" | "products" | "gallery") => {
      const { count: value } = await client.from(table).select("id", { count: "exact", head: true });
      return value ?? 0;
    };

    const [kittens, products, gallery] = await Promise.all([
      count("kittens"),
      count("products"),
      count("gallery"),
    ]);

    if (kittens === 0 && products === 0 && gallery === 0) {
      await client.from("kittens").insert(
        placeholderKittens().map(({ id: _id, ...rest }) => ({
          name: rest.name,
          breed: rest.breed,
          gender: rest.gender,
          date_of_birth: rest.dateOfBirth,
          description: rest.description,
          status: rest.status,
          price: rest.price,
          images: rest.images,
          image_ids: rest.imageIds,
          featured: rest.featured,
          placeholder: true,
        }))
      );
      await client.from("products").insert(
        placeholderProducts().map(({ id: _id, ...rest }) => ({
          name: rest.name,
          animal: rest.animal,
          category: rest.category,
          food_type: rest.foodType,
          brand: rest.brand,
          pack_size: rest.packSize,
          price: rest.price,
          description: rest.description,
          image: rest.image,
          image_id: rest.imageId,
          available: rest.available,
          placeholder: true,
        }))
      );
      await client.from("gallery").insert(
        placeholderGallery().map(({ id: _id, ...rest }) => ({
          image: rest.image,
          image_id: rest.imageId,
          category: rest.category,
          caption: rest.caption,
          sort_order: rest.sortOrder,
          placeholder: true,
        }))
      );
    }
  } catch (error) {
    // Seeding is best-effort: never block reads on it.
    console.warn("[cattery] Supabase seed skipped:", (error as Error).message);
  }

  globalRef.__mfcPgSeeded = true;
}

export const postgresStore: DataStore = {
  mode: "postgres",

  /* ------------------------------- Kittens ---------------------------- */

  async listKittens(filter: ListKittenFilter = {}) {
    const client = await ready();
    let query = client.from("kittens").select("*").order("created_at", { ascending: false });
    if (filter.status) query = query.eq("status", filter.status);
    if (filter.featured) query = query.eq("featured", true);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data as KittenRow[]).map(mapKitten);
  },

  async getKitten(id) {
    const client = await ready();
    const { data, error } = await client.from("kittens").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapKitten(data as KittenRow) : null;
  },

  async createKitten(input) {
    const client = await ready();
    const { data, error } = await client
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
    const client = await ready();
    const { data, error } = await client
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
    const client = await ready();
    const { data, error } = await client
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
    const client = await ready();
    let query = client.from("products").select("*").order("created_at", { ascending: false });
    if (filter.animal) query = query.eq("animal", filter.animal);
    if (filter.category) query = query.eq("category", filter.category);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data as ProductRow[]).map(mapProduct);
  },

  async getProduct(id) {
    const client = await ready();
    const { data, error } = await client.from("products").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapProduct(data as ProductRow) : null;
  },

  async createProduct(input) {
    const client = await ready();
    const { data, error } = await client
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
    const client = await ready();
    const { data, error } = await client
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
    const client = await ready();
    const { data, error } = await client
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
    const client = await ready();
    let query = client.from("gallery").select("*").order("sort_order", { ascending: true });
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
    const client = await ready();
    const { data, error } = await client.from("gallery").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapGallery(data as GalleryRow) : null;
  },

  async createGallery(input) {
    const client = await ready();
    const { data, error } = await client
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
    const client = await ready();
    const update: Record<string, unknown> = {};
    if (patch.image !== undefined) update.image = patch.image;
    if (patch.category !== undefined) update.category = patch.category;
    if (patch.caption !== undefined) update.caption = patch.caption;
    if (patch.sortOrder !== undefined) update.sort_order = patch.sortOrder;

    const { data, error } = await client
      .from("gallery")
      .update(update)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapGallery(data as GalleryRow) : null;
  },

  async deleteGallery(id) {
    const client = await ready();
    const { data, error } = await client
      .from("gallery")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return Boolean(data);
  },

  async reorderGallery(orderedIds) {
    const client = await ready();
    // One update per id; Supabase JS has no multi-row batched update with
    // per-row values, and the gallery is small (≤500 items by schema).
    const results = await Promise.all(
      orderedIds.map((id, index) =>
        client.from("gallery").update({ sort_order: index }).eq("id", id)
      )
    );
    const failed = results.find(({ error }) => error);
    if (failed?.error) throw new Error(failed.error.message);
    return orderedIds.length > 0;
  },

  /* ------------------------------- Admins ----------------------------- */

  /**
   * Admin authorization lives in Supabase Auth + the `admins` table
   * (see src/lib/supabase/authorization.ts). The legacy email/password
   * lookup stays inert by returning null, keeping the interface stable.
   */
  async findAdminByEmail() {
    return null;
  },

  /**
   * Trusted server-side bootstrap: upsert an admins row for a Supabase Auth
   * user. Called only by scripts/supabase-setup.mjs with the secret key.
   */
  async ensureAdmin(user: Omit<AdminUser, "id">) {
    const client = await ready();
    const { data } = await client
      .from("admins")
      .select("id, email, name, role, active, created_at")
      .eq("email", user.email.toLowerCase())
      .maybeSingle();

    if (data) {
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        passwordHash: "",
        role: "admin" as const,
        createdAt: new Date(data.created_at).toISOString(),
      };
    }

    // No auth user id known here — the setup script creates the Auth user and
    // passes its id directly; this path only handles pre-existing rows.
    return null;
  },

  /* -------------------------------- Stats ----------------------------- */

  async stats() {
    const client = await ready();
    const counter = async (table: string, column?: string, value?: unknown) => {
      let query = client.from(table).select("id", { count: "exact", head: true });
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
