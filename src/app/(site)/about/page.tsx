import type { Metadata } from "next";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { BusinessImage } from "@/components/images/BusinessImage";
import { FinalCta } from "@/components/sections/FinalCta";
import { WhatsAppButton } from "@/components/contact/ContactCtas";
import { siteConfig } from "@/lib/site";
import { whatsappMessages } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About Mohammed Fazil Cattery | Persian Cats in Madurai",
  description:
    "Mohammed Fazil Cattery is a small, owner-run cattery in Madurai raising Persian kittens and supplying pet food for cats and dogs.",
  alternates: { canonical: "/about" },
};

const whatWeDo = [
  {
    title: "Persian cats",
    body: "Our cattery is built around Persian cats — the breed we know, raise and care for every day.",
  },
  {
    title: "Persian kittens",
    body: "Kittens are raised in our home environment and listed here when they are ready to be enquired about.",
  },
  {
    title: "Pet food for cats & dogs",
    body: "We also stock pet food for cats and dogs for our local customers in Madurai.",
  },
  {
    title: "Direct conversation",
    body: "Every question is answered by Mohammed Fazil himself, on WhatsApp or by phone.",
  },
];

const whatWeDontDo = [
  "Boarding or pet accommodation",
  "Grooming services",
  "Veterinary or medical services",
  "Pet training or adoption programmes",
  "Delivery outside Madurai",
];

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-line bg-cream" data-cat-mood="relaxed">
        <div className="container-x grid gap-12 py-16 sm:py-20 lg:grid-cols-12 lg:gap-16 lg:py-24">
          <div className="lg:col-span-7">
            <p className="eyebrow">About us</p>
            <h1 className="mt-5 text-balance font-serif text-display-xl text-navy">
              A cattery in Madurai, run by{" "}
              <span className="italic text-brown">{siteConfig.owner}</span>
            </h1>
            <div className="mt-8 space-y-5 text-[15.5px] leading-relaxed text-navy/72 sm:text-base">
              <p>
                Mohammed Fazil Cattery is a small, owner-run business based in Madurai, Tamil Nadu.
                We raise Persian cats and Persian kittens, and we supply pet food for cats and dogs
                to families locally.
              </p>
              <p>
                The business is deliberately small. Kittens are raised in our own home, handled
                daily, and listed on this website only when there is something genuine to share. We
                would rather tell you that nothing is available today than rush you into a
                decision.
              </p>
              <p>
                If you are looking for a Persian kitten in Madurai — or simply need a reliable
                local source of cat and dog food — send us a message. You will be speaking directly
                with {siteConfig.owner}.
              </p>
            </div>

            <div className="mt-9">
              <WhatsAppButton message={whatsappMessages.general} />
            </div>
          </div>

          <div className="lg:col-span-5">
            <BusinessImage
              src={null}
              alt="Mohammed Fazil Cattery"
              label="Cattery Photo"
              variant="cattery"
              ratio="aspect-[4/5]"
              sizes="(max-width: 1024px) 100vw, 38vw"
              className="rounded-xl border border-line"
            />
          </div>
        </div>
      </section>

      <section className="bg-white" aria-labelledby="what-we-do">
        <div className="container-x py-20 sm:py-24">
          <div id="what-we-do">
            <SectionHeading
              index="01"
              eyebrow="What we do"
              title="The honest scope of this business"
              description="No inflated promises — this is exactly what Mohammed Fazil Cattery does today."
            />
          </div>

          <ul className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {whatWeDo.map((item) => (
              <li key={item.title} className="border-t border-navy/12 pt-6">
                <h3 className="font-serif text-xl text-navy">{item.title}</h3>
                <p className="mt-2.5 text-[14.5px] leading-relaxed text-navy/65">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-cream" aria-labelledby="what-we-dont">
        <div className="container-x grid gap-10 py-20 sm:py-24 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div id="what-we-dont">
              <SectionHeading
                index="02"
                eyebrow="What we don't do"
                title="Staying clear about the limits"
                description="Plenty of websites claim to do everything for pets. We don't, so we write it down."
              />
            </div>
          </div>
          <ul className="grid gap-3 lg:col-span-7">
            {whatWeDontDo.map((item) => (
              <li
                key={item}
                className="flex items-center gap-4 rounded-lg border border-navy/12 bg-white px-5 py-4 text-[15px] text-navy/75"
              >
                <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-brown" />
                {item}
                <span className="ml-auto text-[11px] font-bold uppercase tracking-editorial text-navy/40">
                  Not offered
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FinalCta
        title="Come Say Hello."
        description="Whether it is a Persian kitten or a bag of pet food, the conversation starts the same way — a message to Mohammed Fazil."
      />
    </>
  );
}
