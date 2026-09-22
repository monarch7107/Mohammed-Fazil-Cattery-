/**
 * Image upload validation that never trusts the client:
 * magic-byte MIME sniffing, header dimension parsing, size limits and
 * sanity checks for corrupted files.
 */

export const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES ?? 8_388_608);

export const ACCEPTED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export type AcceptedMime = (typeof ACCEPTED_MIME)[number];

const EXTENSION: Record<AcceptedMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

const MIN_DIMENSION = 100;
const MAX_DIMENSION = 12_000;
const MIN_RATIO = 0.2; // width / height
const MAX_RATIO = 6;

export interface ImageValidationSuccess {
  ok: true;
  mime: AcceptedMime;
  ext: string;
  width: number;
  height: number;
  bytes: number;
}

export interface ImageValidationFailure {
  ok: false;
  error: string;
  code:
    | "too-large"
    | "unsupported"
    | "mismatch"
    | "corrupt"
    | "dimensions"
    | "empty";
}

export type ImageValidation = ImageValidationSuccess | ImageValidationFailure;

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  return signature.every((value, index) => bytes[offset + index] === value);
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...Array.from(bytes.slice(offset, offset + length)));
}

/** Identify the real format from the bytes, ignoring what the client claims. */
export function sniffMime(bytes: Uint8Array): AcceptedMime | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return "image/webp";
  if (ascii(bytes, 4, 4) === "ftyp") {
    const brand = ascii(bytes, 8, 4);
    if (brand === "avif" || brand === "avis" || brand === "mif1") return "image/avif";
  }
  return null;
}

function pngDimensions(bytes: Uint8Array): [number, number] | null {
  if (ascii(bytes, 12, 4) !== "IHDR") return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return [view.getUint32(16), view.getUint32(20)];
}

function jpegDimensions(bytes: Uint8Array): [number, number] | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1];
    const isSOF = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSOF) return [view.getUint16(offset + 7), view.getUint16(offset + 5)];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    const segmentLength = view.getUint16(offset + 2);
    if (segmentLength <= 0) return null;
    offset += 2 + segmentLength;
  }
  return null;
}

function webpDimensions(bytes: Uint8Array): [number, number] | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const chunk = ascii(bytes, 12, 4);
  const data = 20;

  if (chunk === "VP8X" && data + 10 <= bytes.length) {
    const width = 1 + (bytes[data + 4] | (bytes[data + 5] << 8) | (bytes[data + 6] << 16));
    const height = 1 + (bytes[data + 7] | (bytes[data + 8] << 8) | (bytes[data + 9] << 16));
    return [width, height];
  }
  if (chunk === "VP8 " && data + 10 <= bytes.length) {
    const width = view.getUint16(data + 6) & 0x3fff;
    const height = view.getUint16(data + 8) & 0x3fff;
    return [width, height];
  }
  if (chunk === "VP8L" && data + 5 <= bytes.length) {
    const b1 = bytes[data + 1];
    const b2 = bytes[data + 2];
    const b3 = bytes[data + 3];
    const b4 = bytes[data + 4];
    const width = 1 + (((b2 & 0x3f) << 8) | b1);
    const height = 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
    return [width, height];
  }
  return null;
}

function avifDimensions(bytes: Uint8Array): [number, number] | null {
  // Locate the `ispe` (image spatial extents) item property.
  for (let i = 0; i + 16 < bytes.length; i += 1) {
    if (
      bytes[i] === 0x69 && // i
      bytes[i + 1] === 0x73 && // s
      bytes[i + 2] === 0x70 && // p
      bytes[i + 3] === 0x65 // e
    ) {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      return [view.getUint32(i + 8), view.getUint32(i + 12)];
    }
  }
  return null;
}

export function readDimensions(bytes: Uint8Array, mime: AcceptedMime): [number, number] | null {
  switch (mime) {
    case "image/png":
      return pngDimensions(bytes);
    case "image/jpeg":
      return jpegDimensions(bytes);
    case "image/webp":
      return webpDimensions(bytes);
    case "image/avif":
      return avifDimensions(bytes);
    default:
      return null;
  }
}

export function validateImage(bytes: Uint8Array, declaredType?: string | null): ImageValidation {
  if (bytes.length === 0) {
    return { ok: false, code: "empty", error: "The file is empty." };
  }

  if (bytes.length > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      code: "too-large",
      error: `File is too large. Maximum size is ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.`,
    };
  }

  const sniffed = sniffMime(bytes);
  if (!sniffed) {
    return {
      ok: false,
      code: "unsupported",
      error: "Unsupported file. Please upload a JPG, PNG, WEBP or AVIF image.",
    };
  }

  if (
    declaredType &&
    ACCEPTED_MIME.includes(declaredType as AcceptedMime) &&
    declaredType !== sniffed &&
    !(declaredType === "image/jpeg" && sniffed === "image/jpeg")
  ) {
    return {
      ok: false,
      code: "mismatch",
      error: "The file content does not match its declared type.",
    };
  }

  const dimensions = readDimensions(bytes, sniffed);
  if (!dimensions || !dimensions[0] || !dimensions[1]) {
    return {
      ok: false,
      code: "corrupt",
      error: "This image could not be read — it may be corrupted.",
    };
  }

  const [width, height] = dimensions;

  if (width < MIN_DIMENSION || height < MIN_DIMENSION || width > MAX_DIMENSION || height > MAX_DIMENSION) {
    return {
      ok: false,
      code: "dimensions",
      error: `Image dimensions must be between ${MIN_DIMENSION}×${MIN_DIMENSION} and ${MAX_DIMENSION}×${MAX_DIMENSION} pixels.`,
    };
  }

  const ratio = width / height;
  if (ratio < MIN_RATIO || ratio > MAX_RATIO) {
    return { ok: false, code: "dimensions", error: "The image proportions look unusual." };
  }

  return {
    ok: true,
    mime: sniffed,
    ext: EXTENSION[sniffed],
    width,
    height,
    bytes: bytes.length,
  };
}
