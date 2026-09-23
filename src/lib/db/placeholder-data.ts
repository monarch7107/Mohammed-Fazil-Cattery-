import type { GalleryItem, Kitten, Product } from "@/models/types";

/**
 * Clearly-labelled placeholder records.
 * They preserve the exact shape of real data so layout, crops, aspect ratios
 * and responsive behaviour are final — but they never claim to be real
 * kittens, real brands, real ages or real prices.
 */

const now = () => new Date().toISOString();

const slug = (value: string, index: number) =>
  `${value}-${index}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export function placeholderKittens(): Kitten[] {
  const base: Array<Pick<Kitten, "name" | "status" | "gender">> = [
    { name: "Persian Kitten — Placeholder 01", status: "available", gender: "male" },
    { name: "Persian Kitten — Placeholder 02", status: "available", gender: "female" },
    { name: "Persian Kitten — Placeholder 03", status: "reserved", gender: "unknown" },
    { name: "Persian Kitten — Placeholder 04", status: "sold", gender: "male" },
  ];

  return base.map((entry, index) => ({
    id: slug("persian-kitten-placeholder", index + 1),
    name: entry.name,
    breed: "Persian",
    gender: entry.gender,
    // No date of birth is invented: age stays hidden until real data exists.
    dateOfBirth: null,
    description:
      "Placeholder record. Replace it from Admin → Kittens with the real kitten details, photographs and availability.",
    status: entry.status,
    price: null,
    images: [],
    imageIds: [],
    featured: index < 2,
    placeholder: true,
    createdAt: now(),
    updatedAt: now(),
  }));
}

export function placeholderProducts(): Product[] {
  const base: Array<Pick<Product, "name" | "animal" | "category">> = [
    { name: "Cat Food — Placeholder (Dry)", animal: "cat", category: "dry" },
    { name: "Cat Food — Placeholder (Wet)", animal: "cat", category: "wet" },
    { name: "Dog Food — Placeholder (Dry)", animal: "dog", category: "dry" },
    { name: "Dog Food — Placeholder (Wet)", animal: "dog", category: "wet" },
  ];

  return base.map((entry, index) => ({
    id: slug("placeholder-product", index + 1),
    name: entry.name,
    animal: entry.animal,
    category: entry.category,
    foodType: entry.category === "dry" ? "Dry Food" : "Wet Food",
    // No brand, pack size or price is invented.
    brand: null,
    packSize: null,
    price: null,
    description:
      "Placeholder record. Replace it from Admin → Products with the real brand, pack size and price when you stock it.",
    image: null,
    imageId: null,
    available: true,
    placeholder: true,
    createdAt: now(),
    updatedAt: now(),
  }));
}

export function placeholderGallery(): GalleryItem[] {
  const base: Array<Pick<GalleryItem, "category" | "caption">> = [
    { category: "kittens", caption: "Kitten Photo — Placeholder" },
    { category: "cats", caption: "Persian Cat Image — Placeholder" },
    { category: "pet-food", caption: "Pet Food Product — Placeholder" },
    { category: "cattery", caption: "Cattery Photo — Placeholder" },
    { category: "kittens", caption: "Kitten Photo — Placeholder" },
    { category: "cats", caption: "Persian Cat Image — Placeholder" },
  ];

  return base.map((entry, index) => ({
    id: slug("gallery-placeholder", index + 1),
    image: null,
    imageId: null,
    category: entry.category,
    caption: entry.caption,
    sortOrder: index,
    placeholder: true,
    createdAt: now(),
  }));
}
