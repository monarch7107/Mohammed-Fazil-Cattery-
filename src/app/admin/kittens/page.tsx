import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth/page-guard";
import { listKittens } from "@/lib/data";
import { KittenManager } from "@/components/admin/KittenManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kittens",
  robots: { index: false, follow: false },
};

export default async function AdminKittensPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  await requireAdminPage("/admin/kittens");
  const kittens = await listKittens();
  const showNew = (await searchParams).new === "1";

  return (
    <div>
      <KittenManager initialItems={kittens} autoOpen={showNew} />
    </div>
  );
}
