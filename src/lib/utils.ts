import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Stable, dependency-free unique id for client-side lists. */
export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function formatINR(value?: number | null): string | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `₹${Math.round(value)}`;
  }
}

export function formatDate(value?: string | Date | null): string | null {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Human age such as "11 weeks" derived from a date of birth. */
export function ageFromDob(dob?: string | Date | null): string | null {
  if (!dob) return null;
  const birth = typeof dob === "string" ? new Date(dob) : dob;
  if (Number.isNaN(birth.getTime())) return null;
  const days = Math.max(0, Math.floor((Date.now() - birth.getTime()) / 86_400_000));
  if (days < 0) return null;
  if (days < 14) return `${Math.max(1, days)} days`;
  const weeks = Math.floor(days / 7);
  if (weeks < 12) return `${weeks} weeks`;
  const months = Math.floor(days / 30.44);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const years = Math.floor(days / 365.25);
  return `${years} year${years === 1 ? "" : "s"}`;
}

export function digitsOnly(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

export function truncate(value: string, max = 160): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}
