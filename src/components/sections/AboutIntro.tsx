import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/lib/site";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { BusinessImage } from "@/components/images/BusinessImage";

const facts = [
  {
    title: "Local to Madurai",
    body: "Based in Madurai, Tamil Nadu. Everything happens here — you speak to the person who raises the kittens.",
  },
  {
    title: "Persian focus",
    body: "Persian cats and Persian kittens are what we raise. No endless catalogue, no shortcuts.",
  },
  {
    title: "Cat & dog food",
    body: "Alongside kittens, we keep pet food for cats and dogs for our local customers.",
  },
];

export function AboutIntro() {
  return (
    <section className="bg-white" data-cat-mood="relaxed" aria-labelledby="about-intro-heading">
      <div className="container-x grid gap-12 py-20 sm:py-24 lg:grid-cols-12 lg:gap-16 lg:py-28">
        <div className="lg:col-span-5">
          <BusinessImage
            src={null}
            alt="Inside the cattery"
            label="Cattery Photo"
            variant="cattery"
            ratio="aspect-[4/3] lg:aspect-[4/5]"
            sizes="(max-width: 1024px) 100vw, 38vw"
            className="rounded-xl border border-line"
          />
        </div>

        <div className="lg:col-span-7">
          <SectionHeading
            index="01"
            eyebrow="About the cattery"
            id="about-intro-heading"
            title={
              <>
                A Small Cattery With A <span className="italic text-brown">Simple Purpose.</span>
              </>
            }
            description={
              <>
                Mohammed Fazil Cattery is a small, owner-run cattery in Madurai. We raise Persian
                kittens with care and attention, and we supply pet food for cats and dogs to people
                in and around the city. There is no call centre and no marketplace in between —
                when you enquire, you are talking to Mohammed Fazil.
              </>
            }
          />

          <dl className="mt-10 grid gap-6 sm:grid-cols-3">
            {facts.map((fact) => (
              <div key={fact.title} className="border-t border-navy/15 pt-5">
                <dt className="font-serif text-lg text-navy">{fact.title}</dt>
                <dd className="mt-2 text-[13.5px] leading-relaxed text-navy/65">{fact.body}</dd>
              </div>
            ))}
          </dl>

          <Link
            href="/about"
            className="group mt-10 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-editorial text-navy transition hover:text-brown"
          >
            Read our story
            <ArrowUpRight
              className="h-4 w-4 transition duration-500 ease-editorial group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </Link>
          <span className="sr-only">{siteConfig.name}</span>
        </div>
      </div>
    </section>
  );
}
