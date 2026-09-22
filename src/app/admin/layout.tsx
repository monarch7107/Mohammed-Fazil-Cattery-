import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: { default: "Admin | Mohammed Fazil Cattery", template: "%s | Admin — Mohammed Fazil Cattery" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-50 border-b border-line bg-cream/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
          <div className="flex items-center gap-4">
            <Logo href="/admin/dashboard" />
            <span className="hidden rounded-full border border-navy/20 px-3 py-1 text-[10px] font-bold uppercase tracking-editorial text-navy/60 sm:inline-flex">
              Admin
            </span>
          </div>
          <AdminNav />
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        {children}
      </main>
    </div>
  );
}
