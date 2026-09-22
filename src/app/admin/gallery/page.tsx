import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth/page-guard";
import { listGallery } from "@/lib/data";
import { GalleryManager } from "@/components/admin/GalleryManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery",
  robots: { index: false, follow: false },
};

export default async function AdminGalleryPage() {
  await requireAdminPage("/admin/gallery");
  const items = await listGallery();
  return <GalleryManager initialItems={items} />;
}
