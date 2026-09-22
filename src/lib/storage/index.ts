import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import type { AcceptedMime } from "@/lib/images";

/**
 * Storage abstraction.
 *
 * The frontend only ever receives a URL string, so switching the production
 * driver requires zero component changes — only environment variables.
 *
 * Drivers:
 *  - firebase    → Firebase Storage (production; folders kittens/ products/ gallery/)
 *  - local       → public/uploads on disk (development only)
 *  - cloudinary  → Cloudinary (legacy alternative, still available)
 */

export interface StoredImage {
  /** Public URL used directly in <img>/next/image. */
  url: string;
  /** Opaque key used to delete the object later. */
  key: string;
}

export interface ImageStorageDriver {
  readonly name: "firebase" | "local" | "cloudinary";
  save(bytes: Uint8Array, mime: AcceptedMime, folder?: string): Promise<StoredImage>;
  remove(key: string): Promise<void>;
}

/* ------------------------------ Firebase -------------------------- */

const FIREBASE_FOLDERS = new Set(["kittens", "products", "gallery", "misc"]);

function safeFolder(folder?: string | null): string {
  const candidate = folder?.trim().toLowerCase();
  return candidate && FIREBASE_FOLDERS.has(candidate) ? candidate : "misc";
}

const firebaseDriver: ImageStorageDriver = {
  name: "firebase",
  async save(bytes, mime, folder) {
    const { storage } = await import("@/lib/firebase/admin");
    const bucket = storage();
    if (!bucket) throw new Error("Firebase Storage is not configured");

    const dir = safeFolder(folder);
    const ext = mime === "image/jpeg" ? "jpg" : mime.split("/")[1];
    const filePath = `${dir}/${Date.now().toString(36)}-${randomUUID().slice(0, 8)}.${ext}`;
    const fileRef = bucket.file(filePath);

    await fileRef.save(Buffer.from(bytes), {
      contentType: mime,
      resumable: false,
      metadata: { cacheControl: "public, max-age=31536000, immutable" },
    });
    await fileRef.makePublic().catch(() => undefined);

    return {
      url: `https://storage.googleapis.com/${bucket.name}/${filePath}`,
      key: filePath,
    };
  },

  async remove(key) {
    const { storage } = await import("@/lib/firebase/admin");
    const bucket = storage();
    if (!bucket || !key) return;
    // Only delete object paths inside the managed folders.
    const dir = key.split("/")[0];
    if (!FIREBASE_FOLDERS.has(dir)) return;
    await bucket.file(key).delete({ ignoreNotFound: true }).catch(() => undefined);
  },
};

/* ------------------------------- Local ---------------------------- */

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

function dateFolder(): string {
  const now = new Date();
  return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const localDriver: ImageStorageDriver = {
  name: "local",
  async save(bytes, mime) {
    const folder = path.join(UPLOAD_ROOT, dateFolder());
    await mkdir(folder, { recursive: true });
    const ext = mime === "image/jpeg" ? "jpg" : mime.split("/")[1];
    const filename = `${Date.now().toString(36)}-${randomUUID().slice(0, 8)}.${ext}`;
    await writeFile(path.join(folder, filename), Buffer.from(bytes));
    return {
      url: `/uploads/${dateFolder()}/${filename}`,
      key: path.join(folder, filename),
    };
  },
  async remove(key) {
    // Only ever delete inside the uploads root.
    const resolved = path.resolve(key);
    if (!resolved.startsWith(UPLOAD_ROOT)) return;
    await unlink(resolved).catch(() => undefined);
  },
};

/* ----------------------------- Cloudinary ------------------------- */

function cloudName(): string | null {
  return process.env.CLOUDINARY_CLOUD_NAME?.trim() || null;
}

function cloudinarySignature(params: Record<string, string>): string {
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!secret) throw new Error("CLOUDINARY_API_SECRET is not configured");
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(toSign + secret).digest("hex");
}

const cloudinaryDriver: ImageStorageDriver = {
  name: "cloudinary",
  async save(bytes, mime) {
    const cloud = cloudName();
    if (!cloud) throw new Error("CLOUDINARY_CLOUD_NAME is not configured");

    const endpoint = `https://api.cloudinary.com/v1_1/${cloud}/image/upload`;
    const form = new FormData();
    const folder = "cattery";
    const preset = process.env.CLOUDINARY_UPLOAD_PRESET?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();

    form.append("file", new Blob([bytes as unknown as BlobPart], { type: mime }), `image.${mime.split("/")[1]}`);
    form.append("folder", folder);

    if (preset) {
      form.append("upload_preset", preset);
    } else if (apiKey) {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const params = { folder, timestamp };
      form.append("api_key", apiKey);
      form.append("timestamp", timestamp);
      form.append("signature", cloudinarySignature(params));
    } else {
      throw new Error("Configure CLOUDINARY_UPLOAD_PRESET or CLOUDINARY_API_SECRET");
    }

    const response = await fetch(endpoint, { method: "POST", body: form });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Cloudinary upload failed (${response.status}): ${detail.slice(0, 200)}`);
    }

    const result = (await response.json()) as { secure_url: string; public_id: string };
    return { url: result.secure_url, key: result.public_id };
  },

  async remove(key) {
    const cloud = cloudName();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    if (!cloud || !apiKey) return;

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const params = { public_id: key, timestamp };
    const form = new FormData();
    form.append("public_id", key);
    form.append("timestamp", timestamp);
    form.append("api_key", apiKey);
    form.append("signature", cloudinarySignature(params));

    await fetch(`https://api.cloudinary.com/v1_1/${cloud}/destroy`, { method: "POST", body: form });
  },
};

/* ------------------------------ Resolver -------------------------- */

/**
 * Driver selection:
 *  1. IMAGE_STORAGE_DRIVER forces a specific driver when set.
 *  2. Firebase Admin credentials present → Firebase Storage (the default
 *     production driver for this project).
 *  3. Otherwise the local disk driver (development).
 */
export function activeDriver(): ImageStorageDriver {
  const configured = process.env.IMAGE_STORAGE_DRIVER?.trim();
  if (configured === "firebase") return firebaseDriver;
  if (configured === "cloudinary") return cloudinaryDriver;
  if (configured === "local") return localDriver;

  const hasFirebase =
    Boolean(process.env.FIREBASE_PROJECT_ID?.trim()) &&
    Boolean(process.env.FIREBASE_CLIENT_EMAIL?.trim()) &&
    Boolean(process.env.FIREBASE_PRIVATE_KEY?.trim());
  if (hasFirebase) return firebaseDriver;

  return localDriver;
}

export function storageIsPersistent(): boolean {
  return activeDriver().name !== "local";
}

/** Folder allowlist shared with the upload endpoint. */
export const UPLOAD_FOLDERS = [...FIREBASE_FOLDERS] as const;
