import { NextResponse } from "next/server";
import { validateImage, ACCEPTED_MIME, type AcceptedMime } from "@/lib/images";
import { activeDriver, isCloudinaryConfigured, UPLOAD_FOLDERS } from "@/lib/storage";
import {
  requireAdmin,
  assertSameOrigin,
  unauthorized,
  forbidden,
  rateLimit,
  clientKey,
  serverError,
} from "@/lib/auth/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return forbidden();
  if (!rateLimit(clientKey(request, "upload"), 40, 60_000)) {
    return NextResponse.json({ error: "Too many uploads. Try again shortly." }, { status: 429 });
  }

  const session = await requireAdmin();
  if (!session) return unauthorized();

  // Image binaries belong in Cloudinary (production). Without credentials the
  // local dev driver would silently persist nothing durable on Vercel, so the
  // upload endpoint fails loudly instead of pretending success.
  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      {
        error:
          "Image storage is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET (server-only).",
      },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was provided." }, { status: 400 });
  }

  const folderRaw = form.get("folder");
  const folder =
    typeof folderRaw === "string" && (UPLOAD_FOLDERS as readonly string[]).includes(folderRaw)
      ? folderRaw
      : undefined;

  const buffer = new Uint8Array(await file.arrayBuffer());
  const validation = validateImage(buffer, file.type);

  if (!validation.ok) {
    const status =
      validation.code === "too-large" ? 413 : validation.code === "unsupported" ? 415 : 400;
    return NextResponse.json({ error: validation.error, code: validation.code }, { status });
  }

  try {
    const driver = activeDriver();
    const stored = await driver.save(buffer, validation.mime as AcceptedMime, folder);

    // `key` is the Cloudinary public_id — store it alongside the URL so the
    // asset can be destroyed when the record is deleted or replaced.
    return NextResponse.json({
      url: stored.url,
      key: stored.key,
      driver: stored.driver,
      width: validation.width,
      height: validation.height,
      bytes: validation.bytes,
      mime: validation.mime,
      accepted: ACCEPTED_MIME,
    });
  } catch (error) {
    console.error("[api/upload] failed", error);
    return serverError(
      "The upload could not be stored. Check the storage configuration and try again."
    );
  }
}
