"use client";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function handle<T>(response: Response): Promise<T> {
  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      (payload as { error?: string } | null)?.error ??
      (response.status === 401
        ? "Your session has expired. Please sign in again."
        : "Something went wrong. Please try again.");
    throw new ApiError(message, response.status, (payload as { details?: unknown } | null)?.details);
  }

  return payload as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  return handle<T>(await fetch(path, { cache: "no-store" }));
}

export async function apiSend<T>(
  path: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown
): Promise<T> {
  return handle<T>(
    await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    })
  );
}

/** Upload with progress via XHR (fetch has no upload progress). */
export function uploadImage(
  file: File,
  onProgress?: (percent: number) => void,
  folder?: "kittens" | "products" | "gallery" | "misc"
): Promise<{ url: string; width: number; height: number; bytes: number }> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    if (folder) form.append("folder", folder);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      try {
        const payload = JSON.parse(xhr.responseText || "{}");
        if (xhr.status >= 200 && xhr.status < 300) resolve(payload);
        else reject(new ApiError(payload.error ?? "Upload failed.", xhr.status));
      } catch {
        reject(new ApiError("Upload failed.", xhr.status));
      }
    };
    xhr.onerror = () => reject(new ApiError("Network error during upload.", 0));
    xhr.send(form);
  });
}

/** Client-side pre-check mirroring the server rules. */
export const MAX_UPLOAD_MB = 8;

export function precheckFile(file: File): string | null {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif"];
  if (!allowed.includes(file.type)) {
    return "Please choose a JPG, PNG, WEBP or AVIF image.";
  }
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    return `File is too large (max ${MAX_UPLOAD_MB} MB).`;
  }
  return null;
}
