import type { Metadata } from "next";
import Link from "next/link";
import { Cat, Images, Package, Plus, type LucideIcon } from "lucide-react";
import { requireAdminPage } from "@/lib/auth/page-guard";
import { getStats, listGallery, listKittens, listProducts } from "@/lib/data";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin-app";
import { storageIsPersistent } from "@/lib/storage";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-editorial text-navy/55">{label}</p>
        <Icon className="h-4 w-4 text-brown" aria-hidden="true" />
      </div>
      <p className="mt-3 font-serif text-4xl tabular-nums text-navy">{value}</p>
      {hint ? <p className="mt-1 text-[12.5px] text-navy/55">{hint}</p> : null}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const session = await requireAdminPage("/admin/dashboard");
  const [stats, kittens, products, gallery] = await Promise.all([
    getStats(),
    listKittens(),
    listProducts(),
    listGallery(),
  ]);

  const firebase = isFirebaseAdminConfigured();
  const persistentStorage = storageIsPersistent();

  const recent = [
    ...kittens.slice(0, 4).map((item) => ({
      id: `k-${item.id}`,
      type: "Kitten" as const,
      title: item.name,
      meta: item.status,
      at: item.updatedAt ?? item.createdAt,
    })),
    ...products.slice(0, 4).map((item) => ({
      id: `p-${item.id}`,
      type: "Product" as const,
      title: item.name,
      meta: item.available ? "Available" : "Unavailable",
      at: item.updatedAt ?? item.createdAt,
    })),
    ...gallery.slice(0, 4).map((item) => ({
      id: `g-${item.id}`,
      type: "Gallery" as const,
      title: item.caption || "Gallery image",
      meta: item.category,
      at: item.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 7);

  const quickActions = [
    { href: "/admin/kittens?new=1", label: "Add Kitten", icon: Cat },
    { href: "/admin/products?new=1", label: "Add Product", icon: Package },
    { href: "/admin/gallery", label: "Upload Gallery Image", icon: Images },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Overview</p>
          <h1 className="mt-3 font-serif text-display-md text-navy">
            Welcome back, {session.name ?? "Administrator"}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-navy px-5 text-[13px] font-semibold text-cream transition hover:bg-brown"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {action.label}
              </Link>
            );
          })}
        </div>
      </div>

      {(!firebase || !persistentStorage) && (
        <div className="rounded-lg border border-dashed border-brown/40 bg-brown/8 px-5 py-4 text-[13px] leading-relaxed text-brown">
          <strong className="font-semibold">Development mode:</strong>{" "}
          {!firebase
            ? "Firebase Admin credentials are not set, so data lives in memory and resets when the server restarts. "
            : ""}
          {!persistentStorage
            ? "Image uploads are stored on local disk; configure Firebase Storage for production."
            : null}
        </div>
      )}

      <section aria-label="Statistics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Kittens"
          value={stats.kittens}
          hint={`${stats.availableKittens} available · ${stats.reservedKittens} reserved · ${stats.soldKittens} sold`}
          icon={Cat}
        />
        <StatCard
          label="Products"
          value={stats.products}
          hint={`${stats.availableProducts} marked available`}
          icon={Package}
        />
        <StatCard
          label="Gallery images"
          value={stats.gallery}
          hint="Ordered as shown on the site"
          icon={Images}
        />
        <StatCard label="Signed in as" value={session.email?.split("@")[0] ?? "—"} hint={session.email ?? ""} icon={Plus} />
      </section>

      <section
        aria-label="Recent updates"
        className="rounded-lg border border-line bg-white shadow-card"
      >
        <div className="flex items-center justify-between gap-4 border-b border-navy/10 px-5 py-4">
          <h2 className="font-serif text-xl text-navy">Recent updates</h2>
          <Badge tone="neutral">{recent.length} items</Badge>
        </div>

        {recent.length > 0 ? (
          <ul className="divide-y divide-navy/8">
            {recent.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-[14.5px] font-semibold text-navy">{entry.title}</p>
                  <p className="text-[12px] uppercase tracking-wider2 text-navy/50">
                    {entry.type} · {entry.meta}
                  </p>
                </div>
                <time
                  dateTime={entry.at}
                  className="shrink-0 text-[12.5px] tabular-nums text-navy/50"
                >
                  {new Date(entry.at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-6 text-sm text-navy/60">No updates yet.</p>
        )}
      </section>
    </div>
  );
}
