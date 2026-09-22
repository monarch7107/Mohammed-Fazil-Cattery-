import { digitsOnly } from "@/lib/utils";

/**
 * All business-facing configuration lives here.
 * Values are read from NEXT_PUBLIC_* env vars so they can be changed
 * without touching source code. Nothing is invented: when a value is not
 * configured, the UI degrades gracefully instead of fabricating it.
 */

const whatsappRaw = digitsOnly(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "");
const phoneRaw = (process.env.NEXT_PUBLIC_PHONE ?? "").trim();
const instagramRaw = (process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "").trim();
const addressRaw = (process.env.NEXT_PUBLIC_BUSINESS_ADDRESS ?? "").trim();

export const siteConfig = {
  name: "Mohammed Fazil Cattery",
  shortName: "MFC",
  owner: "Mohammed Fazil",
  tagline: "Persian Kittens • Pet Food • Madurai",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
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
