import { getStore } from "@/lib/db";
import type { GalleryCategory, KittenStatus } from "@/models/types";

/** Public read helpers. Always resolve — never throw into a render. */

export async function listKittens(options: { status?: KittenStatus; featured?: boolean } = {}) {
  try {
    const store = await getStore();
    return await store.listKittens(options);
  } catch (error) {
    console.error("[cattery] listKittens failed", error);
    return [];
  }
}

export async function listAvailableKittens(limit = 6) {
  const kittens = await listKittens({ status: "available" });
  const rest = await listKittens();
  const merged = kittens.length > 0 ? kittens : rest;
  return merged.slice(0, limit);
}

export async function getKitten(id: string) {
  try {
    const store = await getStore();
    return await store.getKitten(id);
  } catch (error) {
    console.error("[cattery] getKitten failed", error);
    return null;
  }
}

export async function listProducts(options: { animal?: "cat" | "dog"; category?: "dry" | "wet" } = {}) {
  try {
    const store = await getStore();
    return await store.listProducts(options);
  } catch (error) {
    console.error("[cattery] listProducts failed", error);
    return [];
  }
}

export async function listGallery(options: { category?: GalleryCategory } = {}) {
  try {
    const store = await getStore();
    return await store.listGallery(options);
  } catch (error) {
    console.error("[cattery] listGallery failed", error);
    return [];
  }
}

export async function getStats() {
  try {
    const store = await getStore();
    return await store.stats();
  } catch (error) {
    console.error("[cattery] stats failed", error);
    return {
      kittens: 0,
      availableKittens: 0,
      reservedKittens: 0,
      soldKittens: 0,
      products: 0,
      availableProducts: 0,
      gallery: 0,
    };
  }
}
