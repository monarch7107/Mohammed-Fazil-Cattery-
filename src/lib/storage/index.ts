import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import type { AcceptedMime } from "@/lib/images";

/**
 * Storage abstraction.
 *
 * The frontend only ever receives a URL string, so switching the production
 * driver (local → Cloudinary, S3, UploadThing…) requires zero component
 * changes — only environment variables.
 */

export interface StoredImage {
  /** Public URL used directly in <img>/next/image. */
  url: string;
  /** Opaque key used to delete the object later. */
  key: string;
}

export interface ImageStorageDriver {
  readonly name: "local" | "cloudinary";
  save(bytes: Uint8Array, mime: AcceptedMime): Promise<StoredImage>;
  remove(key: string): Promise<void>;
}

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

export function activeDriver(): ImageStorageDriver {
  const configured = process.env.IMAGE_STORAGE_DRIVER?.trim();
  if (configured === "cloudinary") return cloudinaryDriver;
  return localDriver;
}

export function storageIsPersistent(): boolean {
  return activeDriver().name === "cloudinary";
}
