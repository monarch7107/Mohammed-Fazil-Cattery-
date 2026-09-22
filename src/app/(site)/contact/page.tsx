import type { Metadata } from "next";
import { Instagram, MapPin, MessageCircle, Phone } from "lucide-react";
import { contact, siteConfig } from "@/lib/site";
import { whatsappMessages } from "@/lib/whatsapp";
import { WhatsAppButton, CallButton, DirectionsLink } from "@/components/contact/ContactCtas";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { WhatsAppIcon } from "@/components/brand/WhatsAppIcon";
import { EmptyState } from "@/components/sections/EmptyState";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact Mohammed Fazil Cattery | Madurai",
  description:
    "Contact Mohammed Fazil Cattery in Madurai — WhatsApp, phone and Instagram enquiries about Persian kittens and pet food.",
  alternates: { canonical: "/contact" },
};

const messageTemplates = [
  { label: "About a Persian kitten", message: whatsappMessages.kitten },
  { label: "About cat food", message: whatsappMessages["cat-food"] },
  { label: "About dog food", message: whatsappMessages["dog-food"] },
  { label: "General enquiry", message: whatsappMessages.general },
];

export default function ContactPage() {
  const nothingConfigured =
    !contact.hasWhatsApp && !contact.hasPhone && !contact.hasInstagram;

  return (
    <>
      <section className="border-b border-line bg-cream" data-cat-mood="attentive">
        <div className="container-x py-16 sm:py-20 lg:py-24">
          <p className="eyebrow">Contact</p>
          <h1 className="mt-5 max-w-3xl text-balance font-serif text-display-xl text-navy">
            Talk directly to <span className="italic text-brown">{siteConfig.owner}</span>
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-navy/70 sm:text-base">
            No forms that disappear into a queue. Message the cattery and you will get a straight
            answer about availability, timings and next steps.
          </p>
        </div>
      </section>

      <section className="bg-cream">
        <div className="container-x grid gap-10 py-16 sm:py-20 lg:grid-cols-12 lg:gap-14">
          {/* Contact methods */}
          <div className="lg:col-span-6">
            <SectionHeading
              index="01"
              eyebrow="Reach us"
              title="Choose whatever is easiest"
            />

            {nothingConfigured ? (
              <EmptyState
                icon={MessageCircle}
                title="Contact details are being added"
                description="WhatsApp, phone and Instagram details will appear here as soon as they are configured for this website."
                className="mt-8"
              />
            ) : (
              <ul className="mt-8 space-y-4">
                {contact.hasWhatsApp ? (
                  <li className="flex items-center justify-between gap-4 rounded-lg border border-line bg-white p-5 shadow-card">
                    <div className="flex items-center gap-4">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green/12 text-green">
                        <WhatsAppIcon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-editorial text-navy/55">
                          WhatsApp
                        </p>
                        <p className="font-serif text-lg text-navy">
                          +{siteConfig.whatsapp.slice(0, 2)} {siteConfig.whatsapp.slice(2)}
                        </p>
                      </div>
                    </div>
                    <WhatsAppButton size="sm" message={whatsappMessages.general}>
                      Chat
                    </WhatsAppButton>
                  </li>
                ) : null}

                {contact.hasPhone ? (
                  <li className="flex items-center justify-between gap-4 rounded-lg border border-line bg-white p-5 shadow-card">
                    <div className="flex items-center gap-4">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy/10 text-navy">
                        <Phone className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-editorial text-navy/55">
                          Phone
                        </p>
                        <p className="font-serif text-lg text-navy">{siteConfig.phone}</p>
                      </div>
                    </div>
                    <CallButton size="sm" />
                  </li>
                ) : null}

                {contact.hasInstagram ? (
                  <li className="flex items-center justify-between gap-4 rounded-lg border border-line bg-white p-5 shadow-card">
                    <div className="flex items-center gap-4">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brown/12 text-brown">
                        <Instagram className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-editorial text-navy/55">
                          Instagram
                        </p>
                        <p className="font-serif text-lg text-navy">Follow the cattery</p>
                      </div>
                    </div>
                    <a
                      href={siteConfig.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center rounded-full border border-navy/25 px-5 text-[13px] font-semibold text-navy transition hover:border-navy hover:bg-navy hover:text-cream"
                    >
                      Open
                    </a>
                  </li>
                ) : null}

                <li className="flex items-center gap-4 rounded-lg border border-line bg-white p-5 shadow-card">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy/10 text-navy">
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-editorial text-navy/55">
                      Location
                    </p>
                    <p className="font-serif text-lg text-navy">{siteConfig.city}</p>
                    {contact.hasDirections ? (
                      <p className="mt-0.5 text-[13px] text-navy/60">{siteConfig.address}</p>
                    ) : (
                      <p className="mt-0.5 text-[13px] text-navy/55">
                        Exact address shared when you enquire.
                      </p>
                    )}
                  </div>
                </li>
              </ul>
            )}

            {contact.hasDirections ? (
              <div className="mt-6">
                <DirectionsLink className="rounded-full border border-navy/25 px-6 py-3 text-[13px] font-semibold text-navy transition hover:border-navy hover:bg-navy hover:text-cream" />
              </div>
            ) : null}
          </div>

          {/* Message templates */}
          <div className="lg:col-span-6">
            <SectionHeading
              index="02"
              eyebrow="Start with a template"
              title="One tap, pre-written"
              description="Pick the message that fits — we will fill in the details together."
            />

            <ul className="mt-8 grid gap-3">
              {messageTemplates.map((template) => (
                <li key={template.label}>
                  <WhatsAppButton
                    className="w-full justify-between px-6"
                    variant="secondary"
                    message={template.message}
                  >
                    <span className="flex items-center gap-3">
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      {template.label}
                    </span>
                  </WhatsAppButton>
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-xl border border-line bg-white p-6 shadow-card">
              <h2 className="font-serif text-xl text-navy">Good things to include</h2>
              <ul className="mt-4 space-y-2.5 text-[14.5px] leading-relaxed text-navy/70">
                <li className="flex gap-3">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brown" />
                  Whether you are looking for a kitten, cat food or dog food
                </li>
                <li className="flex gap-3">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brown" />
                  Your area in Madurai, so we can suggest a convenient next step
                </li>
                <li className="flex gap-3">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brown" />
                  Any questions about the kitten you saw on this website
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
