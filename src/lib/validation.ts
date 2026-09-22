import type { GalleryInput, KittenInput, ProductInput } from "@/models/types";
import type {
  GalleryInputPayload,
  KittenInputPayload,
  ProductInputPayload,
} from "@/models/schemas";

export { kittenInputSchema, productInputSchema, galleryInputSchema, loginSchema } from "@/models/schemas";

/** Zod payloads allow nulls/empties; models use concrete shapes. */
export function toKittenInput(payload: KittenInputPayload): KittenInput {
  return {
    name: payload.name,
    breed: payload.breed,
    gender: payload.gender,
    dateOfBirth: payload.dateOfBirth ?? null,
    description: payload.description ?? "",
    status: payload.status,
    price: payload.price ?? null,
    images: payload.images ?? [],
    featured: payload.featured ?? false,
  };
}

export function toProductInput(payload: ProductInputPayload): ProductInput {
  return {
    name: payload.name,
    animal: payload.animal,
    category: payload.category,
    foodType: payload.foodType ?? (payload.category === "dry" ? "Dry Food" : "Wet Food"),
    brand: payload.brand ?? null,
    packSize: payload.packSize ?? null,
    price: payload.price ?? null,
    description: payload.description ?? "",
    image: payload.image ?? null,
    available: payload.available ?? true,
  };
}

export function toGalleryInput(payload: GalleryInputPayload): GalleryInput {
  return {
    image: payload.image,
    category: payload.category,
    caption: payload.caption ?? "",
    sortOrder: payload.sortOrder ?? 0,
  };
}
