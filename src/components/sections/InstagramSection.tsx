import { Instagram } from "lucide-react";
import { contact, siteConfig } from "@/lib/site";

/** Renders only when NEXT_PUBLIC_INSTAGRAM_URL is configured — never a fake handle. */
export function InstagramSection() {
  if (!contact.hasInstagram) return null;

  return (
    <section className="bg-cream" aria-labelledby="instagram-heading">
      <div className="container-x py-16 sm:py-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-xl border border-line bg-white p-8 sm:flex-row sm:items-center sm:p-10">
          <div>
            <p className="eyebrow">Follow along</p>
            <h2 id="instagram-heading" className="mt-4 font-serif text-display-md text-navy">
              See the kittens as they grow.
            </h2>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-navy/65">
              Day-to-day photographs from {siteConfig.name} — new arrivals, feeding time and the
              occasional very serious nap.
            </p>
          </div>

          <a
            href={siteConfig.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-13 items-center gap-2.5 rounded-full bg-navy px-7 text-sm font-semibold text-cream transition duration-300 ease-editorial hover:bg-brown"
          >
            <Instagram className="h-4.5 w-4.5" aria-hidden="true" />
            Follow on Instagram
          </a>
        </div>
      </div>
    </section>
  );
}
