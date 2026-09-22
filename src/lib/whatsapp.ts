import { siteConfig } from "@/lib/site";

export type WhatsAppIntent = "general" | "kitten" | "cat-food" | "dog-food" | "visit";

export const whatsappMessages: Record<WhatsAppIntent, string> = {
  general: "Hello, I'd like to know more about Mohammed Fazil Cattery.",
  kitten: "Hello, I'm interested in the Persian kitten shown on your website.",
  "cat-food": "Hello, I'd like to enquire about cat food.",
  "dog-food": "Hello, I'd like to enquire about dog food.",
  visit: "Hello, I'd like to enquire about visiting Mohammed Fazil Cattery in Madurai.",
};

export function messageForKitten(name: string): string {
  return `Hello, I'm interested in the Persian kitten "${name}" shown on your website.`;
}

export function messageForProduct(name: string): string {
  return `Hello, I'd like to enquire about "${name}" shown on your website.`;
}

/**
 * Returns a wa.me deep link, or null when no WhatsApp number is configured.
 * Callers must render a graceful fallback (e.g. link to /contact) when null.
 */
export function whatsappLink(message: string): string | null {
  if (!siteConfig.whatsapp) return null;
  const query = new URLSearchParams({ text: message });
  return `https://wa.me/${siteConfig.whatsapp}?${query.toString()}`;
}

export function telLink(): string | null {
  if (!siteConfig.phone) return null;
  return `tel:${siteConfig.phone.replace(/[^\d+]/g, "")}`;
}

export function instagramLink(): string | null {
  return siteConfig.instagram || null;
}

export function directionsLink(): string | null {
  if (!contact_hasDirections()) return null;
  const q = encodeURIComponent([siteConfig.address, siteConfig.city].filter(Boolean).join(", "));
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function contact_hasDirections(): boolean {
  return Boolean(siteConfig.address);
}
