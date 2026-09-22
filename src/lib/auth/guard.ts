import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "@/lib/auth/session";

/**
 * In-memory sliding-window rate limiter.
 * NOTE: on serverless this is per-instance — good protection against
 * accidental brute force, but a shared store (Redis/Upstash) is the natural
 * future upgrade. See README → Known limitations.
 */
type Bucket = number[];
const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

export function rateLimit(key: string, limit = 5, windowMs = 10 * 60_000): boolean {
  const nowMs = Date.now();

  if (nowMs - lastSweep > 60_000) {
    for (const [k, hits] of buckets) {
      if (hits.length === 0 || hits[hits.length - 1] < nowMs - windowMs) buckets.delete(k);
    }
    lastSweep = nowMs;
  }

  const hits = (buckets.get(key) ?? []).filter((t) => t > nowMs - windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(nowMs);
  buckets.set(key, hits);
  return true;
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}

/** Best-effort client key: honour proxies, fall back to a constant bucket. */
export function clientKey(request: Request, namespace = "default"): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "local";
  return `${namespace}:${ip}`;
}

/**
 * Same-origin check for state-changing requests (CSRF hardening on top of
 * SameSite=Lax cookies). Non-browser clients that send no Origin are allowed.
 */
export function assertSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function requireAdmin(): Promise<SessionPayload | null> {
  return getSession();
}

export function unauthorized(message = "You need to sign in to do that.") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Not allowed.") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export function serverError(message = "Something went wrong. Please try again.") {
  return NextResponse.json({ error: message }, { status: 500 });
}

export function notFound(message = "Not found.") {
  return NextResponse.json({ error: message }, { status: 404 });
}

/** Uniform error extraction for zod failures. */
export function zodDetails(error: { issues: unknown }): unknown {
  return error.issues;
}
