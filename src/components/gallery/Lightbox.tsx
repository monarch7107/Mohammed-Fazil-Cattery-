"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { GalleryItem } from "@/models/types";
import { BusinessImage } from "@/components/images/BusinessImage";
import { cn } from "@/lib/utils";

export function Lightbox({
  items,
  index,
  onIndexChange,
  onClose,
}: {
  items: GalleryItem[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const item = items[index];

  const go = (delta: number) => {
    const next = (index + delta + items.length) % items.length;
    onIndexChange(next);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!item) return null;

  const variant =
    item.category === "kittens"
      ? "kitten"
      : item.category === "cats"
        ? "cat"
        : item.category === "pet-food"
          ? "product"
          : "cattery";

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[130] bg-navy/92 data-[state=open]:animate-fade-in" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-[131] flex flex-col outline-none"
          onTouchStart={(event) => {
            const touch = event.changedTouches[0];
            touchStart.current = { x: touch.clientX, y: touch.clientY };
          }}
          onTouchEnd={(event) => {
            const start = touchStart.current;
            if (!start) return;
            const touch = event.changedTouches[0];
            const deltaX = touch.clientX - start.x;
            const deltaY = touch.clientY - start.y;
            if (Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY)) {
              go(deltaX < 0 ? 1 : -1);
            }
            touchStart.current = null;
          }}
        >
          <div className="flex items-center justify-between gap-4 border-b border-cream/15 px-4 py-3 sm:px-6">
            <p className="text-[11px] font-bold uppercase tracking-editorial text-cream/60 tabular-nums">
              {index + 1} / {items.length}
            </p>
            <DialogPrimitive.Close
              aria-label="Close gallery"
              className="flex h-11 w-11 items-center justify-center rounded-full text-cream/80 transition hover:bg-cream/15 hover:text-cream"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>

          <div className="flex flex-1 items-center justify-center overflow-hidden px-3 py-4 sm:px-16">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous image"
              className="absolute left-2 z-10 flex h-12 w-12 items-center justify-center rounded-full text-cream/85 transition hover:bg-cream/15 sm:left-4"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden="true" />
            </button>

            <figure className="flex h-full max-h-full w-full max-w-4xl flex-col items-center justify-center">
              <div className="w-full overflow-hidden rounded-lg bg-navy-800/60">
                <BusinessImage
                  src={item.image}
                  alt={item.caption || "Gallery image"}
                  label={item.caption || "Gallery Image"}
                  variant={variant}
                  ratio="aspect-[4/3] max-h-[70vh]"
                  sizes="90vw"
                  priority
                />
              </div>
              {item.caption ? (
                <figcaption className="mt-4 text-center text-sm text-cream/75">
                  {item.caption}
                  {item.placeholder ? (
                    <span className="mt-1 block text-[11px] uppercase tracking-editorial text-cream/45">
                      Placeholder image
                    </span>
                  ) : null}
                </figcaption>
              ) : null}
            </figure>

            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next image"
              className="absolute right-2 z-10 flex h-12 w-12 items-center justify-center rounded-full text-cream/85 transition hover:bg-cream/15 sm:right-4"
            >
              <ChevronRight className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className={cn("flex items-center justify-center gap-2 px-4 pb-6")}>
            {items.slice(0, 12).map((entry, entryIndex) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => onIndexChange(entryIndex)}
                aria-label={`Go to image ${entryIndex + 1}`}
                aria-current={entryIndex === index ? "true" : undefined}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  entryIndex === index ? "w-7 bg-cream" : "w-2 bg-cream/35 hover:bg-cream/60"
                )}
              />
            ))}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
