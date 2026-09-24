import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import type { AcceptedMime } from "@/lib/images";

/**
 * Storage abstraction — IMAGES.
 *
 * FINAL ARCHITECTURE: Cloudinary is the only production image storage.
 * PostgreSQL (Supabase) stores metadata (imageUrl / publicId / …); binaries
 * live in Cloudinary. Supabase Storage is intentionally not used.
 *
 * Drivers:
 *  - cloudinary → production (folders kittens/ products/ gallery/)
 *  - local      → development only (public/uploads on disk)
 */

export interface StoredImage {
  /** Public delivery URL used directly in <img>/next/image. */
  url: string;
  /**
   * Opaque identifier used to delete the asset later. For Cloudinary this is
   * the `public_id`; for local storage it is the absolute file path.
   */
  key: string;
  /** Driver that produced the stored image (drives deletion handling). */
  driver: "cloudinary" | "local";
}

export interface ImageStorageDriver {
  readonly name: "cloudinary" | "local";
  save(bytes: Uint8Array, mime: AcceptedMime, folder?: string): Promise<StoredImage>;
  remove(key: string): Promise<void>;
}

/* ----------------------------- Cloudinary ------------------------- */

const CLOUDINARY_FOLDERS = new Set(["kittens", "products", "gallery", "misc"]);

function cloudName(): string | null {
  return process.env.CLOUDINARY_CLOUD_NAME?.trim() || null;
}

function apiKey(): string | null {
  return process.env.CLOUDINARY_API_KEY?.trim() || null;
}

function apiSecret(): string | null {
  return process.env.CLOUDINARY_API_SECRET?.trim() || null;
}

/**
 * CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name> is also
 * accepted (server-only). It is parsed, never logged, and the three
 * individual variables take precedence when both are provided.
 */
function credentials(): { cloud: string; key: string; secret: string } | null {
  const cloud = cloudName();
  const key = apiKey();
  const secret = apiSecret();
  if (cloud && key && secret) return { cloud, key, secret };

  const url = process.env.CLOUDINARY_URL?.trim();
  if (url) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === "cloudinary:" && parsed.username && parsed.password && parsed.hostname) {
        return { cloud: parsed.hostname, key: parsed.username, secret: parsed.password };
      }
    } catch {
      /* fall through */
    }
  }
  return null;
}

/** True when Cloudinary credentials are present (checked without logging). */
export function isCloudinaryConfigured(): boolean {
  return credentials() !== null;
}

/** Folder allowlist shared with the upload endpoint. */
export const UPLOAD_FOLDERS = [...CLOUDINARY_FOLDERS] as const;

function safeFolder(folder?: string | null): string {
  const candidate = folder?.trim().toLowerCase();
  return candidate && CLOUDINARY_FOLDERS.has(candidate) ? candidate : "misc";
}

function cloudinarySignature(params: Record<string, string>, secret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(toSign + secret).digest("hex");
}

const cloudinaryDriver: ImageStorageDriver = {
  name: "cloudinary",

  async save(bytes, mime, folder) {
    const creds = credentials();
    if (!creds) throw new Error("Cloudinary is not configured");

    const dir = safeFolder(folder);
    const endpoint = `https://api.cloudinary.com/v1_1/${creds.cloud}/image/upload`;

    // Server-side SIGNED upload: the API secret never leaves the server and
    // is not part of any request — only its SHA-1 signature is.
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const params: Record<string, string> = { folder: `cattery/${dir}`, timestamp };
    const signature = cloudinarySignature(params, creds.secret);

    const form = new FormData();
    form.append("file", new Blob([bytes as unknown as BlobPart], { type: mime }), `image.${mime.split("/")[1]}`);
    form.append("folder", params.folder);
    form.append("api_key", creds.key);
    form.append("timestamp", timestamp);
    form.append("signature", signature);

    const response = await fetch(endpoint, { method: "POST", body: form });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Cloudinary upload failed (${response.status}): ${detail.slice(0, 200)}`);
    }

    const result = (await response.json()) as { secure_url: string; public_id: string };
    return { url: result.secure_url, key: result.public_id, driver: "cloudinary" };
  },

  async remove(key) {
    const creds = credentials();
    if (!creds || !key) return;

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const params: Record<string, string> = { public_id: key, timestamp };
    const signature = cloudinarySignature(params, creds.secret);

    const form = new FormData();
    form.append("public_id", key);
    form.append("api_key", creds.key);
    form.append("timestamp", timestamp);
    form.append("signature", signature);

    await fetch(`https://api.cloudinary.com/v1_1/${creds.cloud}/image/destroy`, {
      method: "POST",
      body: form,
    });
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
      driver: "local",
    };
  },
  async remove(key) {
    // Only ever delete inside the uploads root.
    const resolved = path.resolve(key);
    if (!resolved.startsWith(UPLOAD_ROOT)) return;
    await unlink(resolved).catch(() => undefined);
  },
};

/* ------------------------------ Resolver -------------------------- */

/**
 * Driver selection:
 *  1. IMAGE_STORAGE_DRIVER=cloudinary|local forces a driver when set.
 *  2. Cloudinary credentials present → Cloudinary (the production driver).
 *  3. Otherwise local disk (development without credentials).
 */
export function activeDriver(): ImageStorageDriver {
  const configured = process.env.IMAGE_STORAGE_DRIVER?.trim();
  if (configured === "cloudinary") return cloudinaryDriver;
  if (configured === "local") return localDriver;

  if (isCloudinaryConfigured()) return cloudinaryDriver;
  return localDriver;
}

export function storageIsPersistent(): boolean {
  return activeDriver().name === "cloudinary";
}

/**
 * Best-effort deletion of stored assets whose identifiers appear in
 * document payloads.
 *
 * PostgreSQL stores image metadata as URL strings (the Cloudinary `secure_url`),
 * so deletion resolves each value into the asset key the active driver
 * understands:
 *  - a Cloudinary delivery URL  → the embedded public_id (`cattery/<folder>/<id>`)
 *  - a bare public_id           → passed to Cloudinary as-is
 *  - an /uploads/… dev path     → the local file under public/
 *
 * Unrecognised values (e.g. legacy remote URLs) are skipped silently —
 * cleanup is always best-effort and never blocks the record operation.
 */
export async function removeImages(
  keys: Array<string | null | undefined>
): Promise<void> {
  const driver = activeDriver();

  const resolved = keys
    .filter((key): key is string => Boolean(key && key.trim()))
    .map((key) => key.trim())
    .map((key) => {
      if (key.startsWith("https://res.cloudinary.com/")) {
        return publicIdFromCloudinaryUrl(key);
      }
      if (key.startsWith("/uploads/") && driver.name === "local") {
        // Local driver keys are absolute paths inside public/.
        return `${process.cwd()}/public${key}`;
      }
      return key;
    })
    .filter((key): key is string => Boolean(key));

  await Promise.all(resolved.map((key) => driver.remove(key).catch(() => undefined)));
}

/**
 * Extract the public_id from a Cloudinary delivery URL.
 *
 * Matches the plain upload URLs this app produces:
 *   https://res.cloudinary.com/<cloud>/image/upload/[v\d+/]<public_id>.<ext>
 * Returns null for URLs it cannot interpret confidently.
 */
export function publicIdFromCloudinaryUrl(url: string): string | null {
  try {
    const { pathname } = new URL(url);
    const marker = "/image/upload/";
    const start = pathname.indexOf(marker);
    if (start === -1) return null;

    let tail = pathname.slice(start + marker.length);
    // Optional version segment (v1234567890).
    tail = tail.replace(/^v\d+\//, "");
    // Optional file extension.
    tail = tail.replace(/\.[a-z0-9]+$/i, "");
    return tail || null;
  } catch {
    return null;
  }
}
