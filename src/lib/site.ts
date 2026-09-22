import { digitsOnly } from "@/lib/utils";

/**
 * All business-facing configuration lives here.
 * Values are read from NEXT_PUBLIC_* env vars so they can be changed
 * without touching source code. Nothing is invented: when a value is not
 * configured, the UI degrades gracefully instead of fabricating it.
 */

/**
 * Resolve the canonical site URL defensively:
 *  1. a valid NEXT_PUBLIC_SITE_URL
 *  2. else the Vercel preview URL when building on Vercel
 *  3. else localhost (development)
 * An empty or malformed value must never crash `metadataBase`/sitemap.
 */
function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    try {
      const parsed = new URL(raw);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return parsed.toString().replace(/\/$/, "");
      }
    } catch {
      // fall through to the derived fallbacks
    }
  }

  const preview = process.env.VERCEL_URL?.trim();
  if (preview) return `https://${preview}`;

  return "http://localhost:3000";
}

const siteUrl = resolveSiteUrl();

const whatsappRaw = digitsOnly(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "");
const phoneRaw = (process.env.NEXT_PUBLIC_PHONE ?? "").trim();
const instagramRaw = (process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "").trim();
const addressRaw = (process.env.NEXT_PUBLIC_BUSINESS_ADDRESS ?? "").trim();

export const siteConfig = {
  name: "Mohammed Fazil Cattery",
  shortName: "MFC",
  owner: "Mohammed Fazil",
  tagline: "Persian Kittens • Pet Food • Madurai",
  url: siteUrl,
  city: process.env.NEXT_PUBLIC_BUSINESS_CITY ?? "Madurai, Tamil Nadu, India",
  cityShort: "Madurai",
  address: addressRaw,
  phone: phoneRaw,
  whatsapp: whatsappRaw,
  instagram: instagramRaw,
  locale: "en_IN",
  timezone: "Asia/Kolkata",
} as const;

export const contact = {
  hasWhatsApp: whatsappRaw.length >= 10,
  hasPhone: phoneRaw.length >= 6,
  hasInstagram: Boolean(instagramRaw),
  /** Directions only exist when a verified address was supplied. */
  hasDirections: Boolean(addressRaw),
} as const;

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/kittens", label: "Kittens" },
  { href: "/pet-food", label: "Pet Food" },
  { href: "/about", label: "About" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
] as const;

export const announcementText = "Persian Kittens & Pet Food • Serving Madurai";
