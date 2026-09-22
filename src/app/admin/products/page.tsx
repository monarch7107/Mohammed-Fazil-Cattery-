import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth/page-guard";
import { listProducts } from "@/lib/data";
import { ProductManager } from "@/components/admin/ProductManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Products",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  await requireAdminPage("/admin/products");
  const products = await listProducts();
  const showNew = (await searchParams).new === "1";
  return <ProductManager initialItems={products} autoOpen={showNew} />;
}
