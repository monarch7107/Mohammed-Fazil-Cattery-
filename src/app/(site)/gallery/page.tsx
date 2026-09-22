import type { Metadata } from "next";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { listGallery } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery | Mohammed Fazil Cattery, Madurai",
  description:
    "Photographs of Persian kittens, adult Persian cats, pet food and the cattery itself — from Mohammed Fazil Cattery in Madurai.",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage() {
  const items = await listGallery();

  return (
    <>
      <section className="border-b border-line bg-cream" data-cat-mood="calm">
        <div className="container-x py-16 sm:py-20 lg:py-24">
          <p className="eyebrow">Gallery</p>
          <div className="mt-5 grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <h1 className="text-balance font-serif text-display-xl text-navy">
                Life at the cattery
              </h1>
              <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-navy/70 sm:text-base">
                Kittens, adult Persian cats, the food we stock and the place they grow up in.
                Tap any photograph to open it full screen.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cream" aria-label="Gallery">
        <div className="container-x py-14 sm:py-16">
          <GalleryGrid items={items} />
        </div>
      </section>
    </>
  );
}
