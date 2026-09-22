import { z } from "zod";

/** Shared field helpers --------------------------------------------------- */

const emptyToNull = (v: unknown) => (v === "" || v === undefined ? null : v);

const optionalText = (max: number) =>
  z.preprocess(
    emptyToNull,
    z.string().trim().max(max, `Must be ${max} characters or fewer`).nullable()
  );

const requiredText = (max: number, label = "This field") =>
  z
    .string({ required_error: `${label} is required`, invalid_type_error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `Must be ${max} characters or fewer`);

const nullablePrice = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : v),
  z
    .number({ invalid_type_error: "Price must be a number" })
    .int("Price must be a whole number")
    .nonnegative("Price cannot be negative")
    .max(10_000_000, "Price looks unrealistic")
    .nullable()
);

const imageRef = z
  .string()
  .trim()
  .min(1)
  .max(400)
  .refine((v) => v.startsWith("/") || /^https?:\/\//i.test(v), {
    message: "Image must be an uploaded path (/uploads/…) or an https URL",
  });

/* ------------------------------- Kittens --------------------------- */

export const kittenInputSchema = z.object({
  name: requiredText(60, "Kitten name"),
  breed: z.string().trim().min(1).max(60).default("Persian"),
  gender: z.enum(["male", "female", "unknown"]),
  dateOfBirth: z.preprocess(
    emptyToNull,
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")
      .nullable()
  ),
  description: z.preprocess(
    emptyToNull,
    z.string().trim().max(1200, "Description is too long").nullable()
  ),
  status: z.enum(["available", "reserved", "sold"]).default("available"),
  price: nullablePrice.optional().default(null),
  images: z.array(imageRef).max(10, "A kitten can have at most 10 images").default([]),
  featured: z.boolean().default(false),
});

export const kittenUpdateSchema = kittenInputSchema;

/* ------------------------------- Products -------------------------- */

export const productInputSchema = z.object({
  name: requiredText(120, "Product name"),
  animal: z.enum(["cat", "dog"]),
  category: z.enum(["dry", "wet"]),
  foodType: z.preprocess(
    emptyToNull,
    z.string().trim().max(40).nullable()
  ),
  brand: optionalText(60),
  packSize: optionalText(40),
  price: nullablePrice.optional().default(null),
  description: z.preprocess(
    emptyToNull,
    z.string().trim().max(1000).nullable()
  ),
  image: z.preprocess(emptyToNull, imageRef.nullable()),
  available: z.boolean().default(true),
});

/* -------------------------------- Gallery -------------------------- */

export const galleryInputSchema = z.object({
  image: imageRef,
  category: z.enum(["kittens", "cats", "pet-food", "cattery"]),
  caption: z.preprocess(
    emptyToNull,
    z.string().trim().max(160, "Caption is too long").nullable()
  ),
  sortOrder: z.coerce.number().int().min(0).max(10_000).default(0),
});

export const galleryReorderSchema = z.object({
  orderedIds: z.array(z.string().trim().min(1)).max(500),
});

/* --------------------------------- Auth ---------------------------- */

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  // Minimum is intentionally 6: real-world cattery passwords are often short.
  // Brute force is mitigated by the 5-attempts-per-10-minutes login rate limit.
  password: z.string().min(6, "Password must be at least 6 characters").max(200),
});

export type KittenInputPayload = z.infer<typeof kittenInputSchema>;
export type ProductInputPayload = z.infer<typeof productInputSchema>;
export type GalleryInputPayload = z.infer<typeof galleryInputSchema>;
export type LoginPayload = z.infer<typeof loginSchema>;
