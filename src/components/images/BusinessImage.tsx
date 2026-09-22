"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type PlaceholderVariant = "kitten" | "cat" | "product" | "gallery" | "cattery" | "food";

const variantArt: Record<PlaceholderVariant, React.ReactNode> = {
  kitten: (
    <g>
      <ellipse cx="100" cy="122" rx="42" ry="36" />
      <path d="M70 100 64 68c-1-5 3-7 7-4l22 17-23 19ZM130 100l6-32c1-5-3-7-7-4l-22 17 23 19Z" />
      <ellipse cx="100" cy="86" rx="34" ry="30" />
    </g>
  ),
  cat: (
    <g>
      <ellipse cx="100" cy="126" rx="46" ry="32" />
      <ellipse cx="100" cy="80" rx="30" ry="27" />
      <path d="M76 62 71 38c-.6-4 3-5 5.5-2.8L94 51 76 62ZM124 62l5-24c.6-4-3-5-5.5-2.8L106 51l18 11Z" />
      <path d="M146 138c14-2 22-13 20-26" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
    </g>
  ),
  product: (
    <g>
      <path d="M64 78h72v70a14 14 0 0 1-14 14H78a14 14 0 0 1-14-14V78Z" />
      <path d="M60 60h80v18H60z" />
      <path d="M84 108h32M84 124h32M84 140h20" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    </g>
  ),
  food: (
    <g>
      <path d="M56 96h88l-8 56a16 16 0 0 1-16 14H80a16 16 0 0 1-16-14l-8-56Z" />
      <path d="M52 78h96v18H52z" />
      <circle cx="100" cy="132" r="14" fill="none" stroke="currentColor" strokeWidth="6" />
    </g>
  ),
  gallery: (
    <g>
      <rect x="52" y="62" width="96" height="76" rx="8" fill="none" stroke="currentColor" strokeWidth="7" />
      <circle cx="80" cy="88" r="9" />
      <path d="M60 130l26-26 20 20 16-14 22 20" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  cattery: (
    <g>
      <path d="M50 104 100 58l50 46" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M64 100v54h72v-54" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      <path d="M90 154v-30h20v30" fill="none" stroke="currentColor" strokeWidth="7" />
    </g>
  ),
};

/**
 * Premium branded placeholder.
 *
 * Preserves the exact aspect ratio, crop box, radius and responsive
 * behaviour of the final photograph so swapping in real images later is a
 * pure data change — no layout shift, no CSS edits.
 */
export function ImagePlaceholder({
  label,
  variant = "gallery",
  className,
}: {
  label: string;
  variant?: PlaceholderVariant;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative h-full w-full overflow-hidden bg-cream-200",
        className
      )}
      style={{
        backgroundImage:
          "repeating-linear-gradient(135deg, rgba(16,42,67,0.035) 0 2px, transparent 2px 11px)",
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          viewBox="0 0 200 200"
          className="h-[46%] w-[46%] text-navy/22"
          fill="currentColor"
          aria-hidden="true"
        >
          {variantArt[variant]}
        </svg>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-cream-300/80 to-transparent px-4 pb-3 pt-10">
        <span className="text-[10px] font-bold uppercase tracking-editorial text-navy/62">
          {label}
        </span>
        <span className="rounded-full border border-dashed border-brown/45 bg-cream/85 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider2 text-brown">
          Placeholder
        </span>
      </div>

      <span className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/55 to-transparent" />
    </div>
  );
}

export interface BusinessImageProps {
  src?: string | null;
  alt: string;
  /** Text shown on the placeholder, e.g. "Persian Cat Image". */
  label?: string;
  variant?: PlaceholderVariant;
  /** Tailwind aspect class applied to the crop box. */
  ratio?: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
}

/**
 * Single image entry point for the whole site.
 * Real image → next/image with lazy loading; missing/failed image → branded
 * placeholder with the identical crop box.
 */
export function BusinessImage({
  src,
  alt,
  label,
  variant = "gallery",
  ratio = "aspect-[4/3]",
  className,
  imageClassName,
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
}: BusinessImageProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div className={cn("relative overflow-hidden bg-cream-200", ratio, className)}>
      {showImage ? (
        <Image
          src={src as string}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn("object-cover", imageClassName)}
          onError={() => setFailed(true)}
        />
      ) : (
        <ImagePlaceholder
          label={label ?? alt}
          variant={variant}
          className={imageClassName}
        />
      )}
    </div>
  );
}

/* ---- Purpose-specific wrappers (same crop behaviour, brand defaults) ---- */

export function KittenImage(props: BusinessImageProps) {
  return (
    <BusinessImage
      variant="kitten"
      label="Kitten Photo"
      ratio="aspect-[4/5]"
      {...props}
      alt={props.alt}
    />
  );
}

export function ProductImage(props: BusinessImageProps) {
  return (
    <BusinessImage
      variant="product"
      label="Pet Food Product"
      ratio="aspect-[4/3]"
      {...props}
      alt={props.alt}
    />
  );
}

export function GalleryImage(props: BusinessImageProps) {
  return (
    <BusinessImage
      variant="gallery"
      label="Gallery Image"
      ratio="aspect-[4/3]"
      {...props}
      alt={props.alt}
    />
  );
}
