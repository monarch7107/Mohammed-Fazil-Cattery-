"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BusinessImage } from "@/components/images/BusinessImage";
import { cn } from "@/lib/utils";

export function KittenGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const list = images.length > 0 ? images : [null];
  const total = list.length;

  const move = useCallback(
    (delta: number) => {
      setActive((current) => (current + delta + total) % total);
    },
    [total]
  );

  useEffect(() => setActive(0), [images]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-xl border border-line bg-cream-200 shadow-card">
        <BusinessImage
          src={list[active]}
          alt={`${name} — Persian kitten photo ${active + 1} of ${total}`}
          label={images.length > 0 ? "Kitten Photo" : "Kitten Photo Coming Soon"}
          variant="kitten"
          ratio="aspect-[4/5] sm:aspect-[4/3]"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />

        {total > 1 ? (
          <>
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-cream/90 text-navy shadow-card transition hover:bg-cream"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-cream/90 text-navy shadow-card transition hover:bg-cream"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </>
        ) : null}

        <p className="absolute bottom-3 right-4 rounded-full bg-navy/80 px-3 py-1 text-[11px] font-semibold tabular-nums text-cream">
          {active + 1} / {total}
        </p>
      </div>

      {total > 1 ? (
        <ul className="flex flex-wrap gap-3">
          {list.map((image, index) => (
            <li key={image ?? `placeholder-${index}`}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show photo ${index + 1}`}
                aria-current={index === active ? "true" : undefined}
                className={cn(
                  "block h-20 w-20 overflow-hidden rounded-md border-2 transition",
                  index === active ? "border-navy" : "border-transparent opacity-70 hover:opacity-100"
                )}
              >
                <BusinessImage
                  src={image}
                  alt=""
                  label="Photo"
                  variant="kitten"
                  ratio="aspect-square"
                  sizes="80px"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
