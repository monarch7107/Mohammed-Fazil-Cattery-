/** Domain models — PostgreSQL tables map 1:1 to these shapes. */

export type KittenStatus = "available" | "reserved" | "sold";
export type Gender = "male" | "female" | "unknown";
export type ProductAnimal = "cat" | "dog";
export type FoodCategory = "dry" | "wet";
export type GalleryCategory = "kittens" | "cats" | "pet-food" | "cattery";

export const KITTEN_STATUSES: KittenStatus[] = ["available", "reserved", "sold"];
export const GALLERY_CATEGORIES: GalleryCategory[] = ["kittens", "cats", "pet-food", "cattery"];

export interface Kitten {
  id: string;
  name: string;
  breed: string;
  gender: Gender;
  dateOfBirth: string | null;
  description: string;
  status: KittenStatus;
  price: number | null;
  /** Empty array => the UI renders branded placeholders of the right crop. */
  images: string[];
  /** Cloudinary public_ids, index-aligned with `images` (empty for local/placeholder). */
  imageIds: string[];
  featured: boolean;
  /** True when this record is development placeholder content. */
  placeholder: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  animal: ProductAnimal;
  /** Dry / wet subcategory. */
  category: FoodCategory;
  /** Human-facing label shown on the card (defaults from category). */
  foodType: string;
  brand: string | null;
  packSize: string | null;
  price: number | null;
  description: string;
  image: string | null;
  /** Cloudinary public_id of `image` (null for local/placeholder images). */
  imageId: string | null;
  available: boolean;
  placeholder: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryItem {
  id: string;
  image: string | null;
  /** Cloudinary public_id of `image` (null for local/placeholder images). */
  imageId: string | null;
  category: GalleryCategory;
  caption: string;
  sortOrder: number;
  placeholder: boolean;
  createdAt: string;
}

/**
 * Legacy compatibility shape kept only for the DataStore contract's
 * findAdminByEmail/ensureAdmin placeholders — no password hashes exist in
 * this architecture (authentication is Supabase Auth).
 */
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: "admin";
  createdAt: string;
}

export interface StoreStats {
  kittens: number;
  availableKittens: number;
  reservedKittens: number;
  soldKittens: number;
  products: number;
  availableProducts: number;
  gallery: number;
}

/* ------------------------------------------------------------------ */
/* Write payloads (already validated by zod before they reach a store) */
/* ------------------------------------------------------------------ */

export type KittenInput = Omit<Kitten, "id" | "createdAt" | "updatedAt" | "placeholder">;
export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt" | "placeholder">;
export type GalleryInput = Omit<GalleryItem, "id" | "createdAt" | "placeholder">;

export type PublicKitten = Kitten;
export type PublicProduct = Product;
export type PublicGallery = GalleryItem;
