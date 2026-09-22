import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { siteConfig } from "@/lib/site";
import { BusinessImage } from "@/components/images/BusinessImage";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/contact/ContactCtas";
import { whatsappMessages } from "@/lib/whatsapp";

const facts = ["Madurai", "Persian Cats", "Cat & Dog Food"];

export function Hero() {
  return (
    <section
      className="relative overflow-hidden bg-cream"
      data-cat-mood="attentive"
      aria-labelledby="hero-heading"
    >
      {/* Very subtle paw trail */}
      <div className="pointer-events-none absolute -right-10 top-6 hidden h-72 w-72 opacity-[0.06] lg:block" aria-hidden="true">
        <svg viewBox="0 0 64 64" className="h-full w-full text-navy" fill="currentColor">
          <ellipse cx="32" cy="40" rx="15" ry="12" />
          <ellipse cx="14" cy="24" rx="6.5" ry="8" />
          <ellipse cx="27" cy="16" rx="6" ry="8" />
          <ellipse cx="41" cy="16" rx="6" ry="8" />
          <ellipse cx="52" cy="25" rx="6" ry="7.5" />
        </svg>
      </div>

      <div className="container-x grid items-center gap-14 py-16 sm:py-20 lg:grid-cols-12 lg:gap-12 lg:py-28">
        <div className="lg:col-span-7 xl:col-span-6">
          <p className="eyebrow animate-fade-up">
            {siteConfig.name} • {siteConfig.cityShort}
          </p>

          <h1
            id="hero-heading"
            className="mt-6 animate-fade-up text-balance text-display-2xl font-serif text-navy"
            style={{ animationDelay: "0.08s" }}
          >
            Persian Kittens,
            <br />
            <span className="italic text-brown">Raised With Care.</span>
          </h1>

          <div
            className="mt-8 h-px w-24 origin-left animate-draw-rule bg-navy/30"
            aria-hidden="true"
            style={{ animationDelay: "0.3s" }}
          />

          <p
            className="mt-8 max-w-xl animate-fade-up text-[16px] leading-relaxed text-navy/72 sm:text-[17px]"
            style={{ animationDelay: "0.16s" }}
          >
            Discover Persian kittens raised with care in our Madurai-based cattery. We also provide
            pet food for cats and dogs.
          </p>

          <div
            className="mt-9 flex flex-wrap items-center gap-3 animate-fade-up"
            style={{ animationDelay: "0.24s" }}
          >
            <Button asChild size="lg">
              <Link href="/kittens">
                View Available Kittens
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <WhatsAppButton size="lg" message={whatsappMessages.general} />
          </div>

          <dl
            className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 animate-fade-up border-t border-line pt-7"
            style={{ animationDelay: "0.32s" }}
          >
            {facts.map((fact) => (
              <div key={fact} className="flex items-center gap-3">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brown" />
                <dt className="sr-only">Focus</dt>
                <dd className="text-[11.5px] font-bold uppercase tracking-wider2 text-navy/65">
                  {fact}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative lg:col-span-5 xl:col-span-6">
          <div
            className="relative animate-fade-up overflow-hidden rounded-xl border border-line shadow-card-hover"
            style={{ animationDelay: "0.12s" }}
          >
            <BusinessImage
              src={null}
              alt="Persian cat at Mohammed Fazil Cattery"
              label="Persian Cat Image"
              variant="cat"
              ratio="aspect-[4/5] sm:aspect-[5/6] lg:aspect-[4/5]"
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="rounded-xl"
            />

            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-navy/85 via-navy/35 to-transparent p-5 sm:p-6">
              <p className="max-w-[16rem] text-[13px] leading-relaxed text-cream/90">
                Enquiries are handled directly by {siteConfig.owner} — no middlemen, no call
                centre.
              </p>
            </div>
          </div>

          {/* Floating scope card */}
          <div className="absolute -bottom-6 -left-2 hidden max-w-[15rem] rounded-lg border border-line bg-white p-4 shadow-card-hover sm:block lg:-left-8">
            <p className="text-[10.5px] font-bold uppercase tracking-editorial text-brown">
              Now listing
            </p>
            <p className="mt-1.5 font-serif text-[15px] leading-snug text-navy">
              Persian kittens &amp; pet food, right here in Madurai.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
