import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { listKittens } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/kittens`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/pet-food`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/gallery`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  let kittenRoutes: MetadataRoute.Sitemap = [];
  try {
    const kittens = await listKittens();
    kittenRoutes = kittens
      .filter((kitten) => kitten.status !== "sold")
      .map((kitten) => ({
        url: `${base}/kittens/${kitten.id}`,
        lastModified: new Date(kitten.updatedAt ?? kitten.createdAt),
        changeFrequency: "weekly",
        priority: 0.7,
      }));
  } catch {
    kittenRoutes = [];
  }

  return [...staticRoutes, ...kittenRoutes];
}
