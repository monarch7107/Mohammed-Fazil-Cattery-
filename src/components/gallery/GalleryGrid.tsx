"use client";

import { useState } from "react";
import { Images } from "lucide-react";
import type { GalleryCategory, GalleryItem } from "@/models/types";
import { GALLERY_CATEGORIES } from "@/models/types";
import { BusinessImage } from "@/components/images/BusinessImage";
import { EmptyState } from "@/components/sections/EmptyState";
import { WhatsAppButton } from "@/components/contact/ContactCtas";
import { Lightbox } from "@/components/gallery/Lightbox";
import { useCat } from "@/components/providers/CatMoodProvider";
import { whatsappMessages } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

type Filter = "all" | GalleryCategory;

const labels: Record<Filter, string> = {
  all: "All",
  kittens: "Kittens",
  cats: "Cats",
  "pet-food": "Pet Food",
  cattery: "Cattery",
};

const variantFor = (category: GalleryCategory) =>
  category === "kittens"
    ? ("kitten" as const)
    : category === "cats"
      ? ("cat" as const)
      : category === "pet-food"
        ? ("product" as const)
        : ("cattery" as const);

/** Varied crops so the grid reads editorially rather than as a uniform table. */
const ratioCycle = ["aspect-[4/5]", "aspect-square", "aspect-[4/5]", "aspect-[5/4]"];

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { setPaused } = useCat();

  const filtered = filter === "all" ? items : items.filter((item) => item.category === filter);
  const options: Filter[] = ["all", ...GALLERY_CATEGORIES];

  const open = (index: number) => {
    setOpenIndex(index);
    setPaused(true);
  };

  const close = () => {
    setOpenIndex(null);
    setPaused(false);
  };

  return (
    <>
      <div
        role="group"
        aria-label="Filter gallery"
        className="flex flex-wrap items-center gap-2"
      >
        {options.map((option) => {
          const active = option === filter;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              aria-pressed={active}
              className={cn(
                "inline-flex h-10 items-center rounded-full border px-5 text-[13px] font-semibold transition duration-300 ease-editorial",
                active
                  ? "border-navy bg-navy text-cream"
                  : "border-navy/20 text-navy/70 hover:border-navy/60 hover:text-navy"
              )}
            >
              {labels[option]}
            </button>
          );
        })}
      </div>

      {filtered.length > 0 ? (
        <ul className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {filtered.map((item, index) => (
            <li key={item.id} className={cn(index % 7 === 0 && "col-span-2")}>
              <button
                type="button"
                onClick={() => open(index)}
                className="group block w-full overflow-hidden rounded-lg border border-line bg-white text-left shadow-card transition hover:shadow-card-hover"
                aria-label={`Open image: ${item.caption || "gallery image"}`}
              >
                <BusinessImage
                  src={item.image}
                  alt={item.caption || "Gallery image from Mohammed Fazil Cattery"}
                  label={item.caption || "Gallery Image"}
                  variant={variantFor(item.category)}
                  ratio={
                    index % 7 === 0
                      ? "aspect-[16/10]"
                      : ratioCycle[index % ratioCycle.length]
                  }
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 24vw"
                  imageClassName="transition duration-700 ease-editorial group-hover:scale-105"
                />
                {item.caption ? (
                  <span className="block px-4 py-3 text-[13px] font-medium text-navy/75">
                    {item.caption}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Images}
          title="Nothing in this category yet"
          description="Photographs are added as new kittens and stock arrive. Check the other categories, or ask us directly."
          className="mt-10"
          action={<WhatsAppButton size="sm" message={whatsappMessages.general} />}
        />
      )}

      {openIndex !== null && filtered[openIndex] ? (
        <Lightbox
          items={filtered}
          index={openIndex}
          onIndexChange={setOpenIndex}
          onClose={close}
        />
      ) : null}
    </>
  );
}
