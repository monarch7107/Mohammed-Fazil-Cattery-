import type { Metadata } from "next";
import Link from "next/link";
import { Cat, MessageCircle } from "lucide-react";
import { KittenCard } from "@/components/kittens/KittenCard";
import { KittenFilters } from "@/components/kittens/KittenFilters";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { EmptyState } from "@/components/sections/EmptyState";
import { WhatsAppButton } from "@/components/contact/ContactCtas";
import { listKittens } from "@/lib/data";
import { whatsappMessages } from "@/lib/whatsapp";
import { KITTEN_STATUSES, type KittenStatus } from "@/models/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Persian Kittens in Madurai | Mohammed Fazil Cattery",
  description:
    "Explore the Persian kittens currently available at Mohammed Fazil Cattery in Madurai — see breed, gender, age and availability, then enquire directly.",
  alternates: { canonical: "/kittens" },
};

type Params = { status?: string };

export default async function KittensPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const { status } = await searchParams;
  const validStatus = KITTEN_STATUSES.includes(status as KittenStatus)
    ? (status as KittenStatus)
    : undefined;

  const kittens = await listKittens(validStatus ? { status: validStatus } : {});
  const filtered = validStatus ? kittens : kittens;

  return (
    <>
      <section className="border-b border-line bg-cream" data-cat-mood="curious">
        <div className="container-x py-16 sm:py-20 lg:py-24">
          <p className="eyebrow">{validStatus ? `Showing ${validStatus}` : "Available now"}</p>
          <div className="mt-5 grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <h1 className="text-balance font-serif text-display-xl text-navy">
                Persian Kittens
              </h1>
              <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-navy/70 sm:text-base">
                Explore our currently available Persian kittens in Madurai. Availability changes
                regularly — if a kitten you like is marked reserved or sold, ask us about upcoming
                litters.
              </p>
            </div>
            <div className="lg:col-span-5 lg:justify-self-end">
              <KittenFilters active={validStatus ?? "all"} />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cream" aria-label="Kitten listings">
        <div className="container-x py-14 sm:py-16">
          {filtered.length > 0 ? (
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((kitten, index) => (
                <li key={kitten.id}>
                  <KittenCard kitten={kitten} priority={index < 2} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Cat}
              title={
                validStatus
                  ? `No kittens are marked “${validStatus}” right now`
                  : "No kittens are listed right now"
              }
              description="We keep litters small, so availability comes and goes. Message us and we will tell you what to expect — or check back soon."
              action={
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <WhatsAppButton message={whatsappMessages.kitten} />
                  <Link
                    href="/kittens"
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-navy/25 px-6 text-sm font-semibold text-navy transition hover:border-navy"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    Show all kittens
                  </Link>
                </div>
              }
            />
          )}
        </div>
      </section>

      <section className="bg-white">
        <div className="container-x py-16">
          <SectionHeading
            index="→"
            eyebrow="Before you enquire"
            title="How availability works"
            description="Kittens move between available, reserved and sold as families confirm. We update this page ourselves, and we will always tell you the current status honestly when you message."
            actions={<WhatsAppButton message={whatsappMessages.general} size="sm" />}
          />
        </div>
      </section>
    </>
  );
}
