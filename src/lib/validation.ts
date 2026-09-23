import type { GalleryInput, KittenInput, ProductInput } from "@/models/types";
import type {
  GalleryInputPayload,
  KittenInputPayload,
  ProductInputPayload,
} from "@/models/schemas";
import { publicIdFromCloudinaryUrl } from "@/lib/storage";

export { kittenInputSchema, productInputSchema, galleryInputSchema, loginSchema } from "@/models/schemas";

/**
 * Derive the Cloudinary public_id from the delivery URL.
 *
 * The admin client only ever sends URL strings, so the server derives the
 * asset identifier itself — the client never supplies (or can forge) the
 * public_id that deletion later uses.
 */

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
    imageIds: (payload.images ?? [])
      .map((url) => publicIdFromCloudinaryUrl(url))
      .filter((id): id is string => Boolean(id)),
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
    imageId: payload.image ? publicIdFromCloudinaryUrl(payload.image) : null,
    available: payload.available ?? true,
  };
}

export function toGalleryInput(payload: GalleryInputPayload): GalleryInput {
  return {
    image: payload.image,
    imageId: publicIdFromCloudinaryUrl(payload.image),
    category: payload.category,
    caption: payload.caption ?? "",
    sortOrder: payload.sortOrder ?? 0,
  };
}
