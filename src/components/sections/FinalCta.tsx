import { WhatsAppButton, CallButton } from "@/components/contact/ContactCtas";
import { whatsappMessages } from "@/lib/whatsapp";
import { siteConfig } from "@/lib/site";

export function FinalCta({
  title = "Looking For A Persian Kitten?",
  description = "Tell us what you are looking for and we will share what is currently available at the cattery.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section
      className="on-dark relative overflow-hidden bg-navy text-cream"
      data-cat-mood="attentive"
      aria-labelledby="final-cta-heading"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 opacity-[0.07]"
      >
        <svg viewBox="0 0 64 64" className="h-full w-full text-cream" fill="currentColor">
          <ellipse cx="32" cy="40" rx="15" ry="12" />
          <ellipse cx="14" cy="24" rx="6.5" ry="8" />
          <ellipse cx="27" cy="16" rx="6" ry="8" />
          <ellipse cx="41" cy="16" rx="6" ry="8" />
          <ellipse cx="52" cy="25" rx="6" ry="7.5" />
        </svg>
      </div>

      <div className="container-x relative py-20 text-center sm:py-24 lg:py-28">
        <p className="eyebrow-light">Talk to {siteConfig.owner}</p>
        <h2
          id="final-cta-heading"
          className="mx-auto mt-6 max-w-3xl text-balance font-serif text-display-xl text-cream"
        >
          {title}
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-cream/70 sm:text-base">
          {description}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <WhatsAppButton size="lg" variant="cream" message={whatsappMessages.kitten} />
          <CallButton size="lg" variant="outlineLight" />
        </div>
      </div>
    </section>
  );
}
