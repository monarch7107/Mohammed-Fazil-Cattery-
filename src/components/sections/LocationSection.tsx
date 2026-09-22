import { MapPin } from "lucide-react";
import { siteConfig } from "@/lib/site";
import { BusinessImage } from "@/components/images/BusinessImage";
import { WhatsAppButton, DirectionsLink } from "@/components/contact/ContactCtas";
import { whatsappMessages } from "@/lib/whatsapp";

export function LocationSection() {
  return (
    <section className="bg-white" data-cat-mood="calm" aria-labelledby="location-heading">
      <div className="container-x grid items-center gap-12 py-20 sm:py-24 lg:grid-cols-12 lg:gap-16 lg:py-28">
        <div className="lg:col-span-6">
          <div className="flex items-center gap-3 text-navy/50">
            <span className="text-[11px] font-bold tabular-nums tracking-editorial">07</span>
            <span className="h-px w-8 bg-current opacity-50" aria-hidden="true" />
            <span className="text-[11px] font-bold uppercase tracking-editorial">Where we are</span>
          </div>

          <h2 id="location-heading" className="mt-5 text-balance font-serif text-display-lg text-navy">
            Based in <span className="italic text-brown">Madurai</span>, Tamil Nadu.
          </h2>

          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-navy/70">
            Mohammed Fazil Cattery operates locally in Madurai. We keep the conversation simple:
            message us, tell us what you are looking for, and we will tell you honestly what is
            available right now.
          </p>

          <ul className="mt-8 space-y-3 text-[15px] text-navy/75">
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4.5 w-4.5 shrink-0 text-brown" aria-hidden="true" />
              <span>
                {siteConfig.city}
                {siteConfig.address ? (
                  <span className="block text-sm text-navy/60">{siteConfig.address}</span>
                ) : (
                  <span className="block text-sm text-navy/55">
                    Exact address shared when you enquire.
                  </span>
                )}
              </span>
            </li>
          </ul>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <WhatsAppButton message={whatsappMessages.visit} />
            <DirectionsLink className="rounded-full border border-navy/25 px-6 py-3 text-[13px] font-semibold text-navy transition hover:border-navy hover:bg-navy hover:text-cream [&_svg]:h-4" />
          </div>
        </div>

        <div className="lg:col-span-6">
          <BusinessImage
            src={null}
            alt="Madurai, Tamil Nadu"
            label="Madurai Location Image"
            variant="cattery"
            ratio="aspect-[4/3] lg:aspect-[5/4]"
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="rounded-xl border border-line"
          />
        </div>
      </div>
    </section>
  );
}
