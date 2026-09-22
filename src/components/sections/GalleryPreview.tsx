import Link from "next/link";
import { ArrowUpRight, Images } from "lucide-react";
import type { GalleryItem } from "@/models/types";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { EmptyState } from "@/components/sections/EmptyState";
import { BusinessImage } from "@/components/images/BusinessImage";
import { whatsappMessages } from "@/lib/whatsapp";
import { WhatsAppButton } from "@/components/contact/ContactCtas";

const variantFor = (category: GalleryItem["category"]) =>
  category === "kittens"
    ? ("kitten" as const)
    : category === "cats"
      ? ("cat" as const)
      : category === "pet-food"
        ? ("product" as const)
        : ("cattery" as const);

const ratios = ["aspect-[4/5]", "aspect-square", "aspect-[4/5]", "aspect-square", "aspect-[4/5]"];

export function GalleryPreview({ items }: { items: GalleryItem[] }) {
  const shown = items.slice(0, 5);

  return (
    <section className="bg-white" data-cat-mood="calm" aria-labelledby="gallery-preview-heading">
      <div className="container-x py-20 sm:py-24 lg:py-28">
        <div id="gallery-preview-heading">
          <SectionHeading
            index="05"
            eyebrow="Gallery"
            title="From The Cattery"
            description="Photographs of our Persian cats, kittens and the food we stock — updated as new ones arrive."
            actions={
              <Link
                href="/gallery"
                className="group inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-editorial text-navy transition hover:text-brown"
              >
                Open gallery
                <ArrowUpRight
                  className="h-4 w-4 transition duration-500 ease-editorial group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                />
              </Link>
            }
          />
        </div>

        {shown.length > 0 ? (
          <ul className="mt-12 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-5">
            {shown.map((item, index) => (
              <li key={item.id} className={index === 0 ? "col-span-2 lg:col-span-1" : undefined}>
                <Link href="/gallery" className="group block">
                  <div className="overflow-hidden rounded-lg border border-line">
                    <BusinessImage
                      src={item.image}
                      alt={item.caption || "Gallery image from Mohammed Fazil Cattery"}
                      label={item.caption || "Gallery Image"}
                      variant={variantFor(item.category)}
                      ratio={ratios[index % ratios.length]}
                      sizes="(max-width: 1024px) 45vw, 18vw"
                      imageClassName="transition duration-700 ease-editorial group-hover:scale-105"
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={Images}
            title="Gallery is being prepared"
            description="Fresh photographs of our kittens and cattery will appear here shortly."
            className="mt-12"
            action={<WhatsAppButton message={whatsappMessages.general} size="sm" />}
          />
        )}
      </div>
    </section>
  );
}
