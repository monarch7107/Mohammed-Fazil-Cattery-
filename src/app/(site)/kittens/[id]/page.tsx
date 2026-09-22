import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Cat, Phone } from "lucide-react";
import { KittenGallery } from "@/components/kittens/KittenGallery";
import { StatusBadge } from "@/components/kittens/KittenCard";
import { Badge } from "@/components/ui/badge";
import { WhatsAppButton, CallButton } from "@/components/contact/ContactCtas";
import { getKitten } from "@/lib/data";
import { ageFromDob, formatDate } from "@/lib/utils";
import { messageForKitten } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const kitten = await getKitten(decodeURIComponent(id));
  if (!kitten) return { title: "Kitten not found" };

  return {
    title: `${kitten.name} — Persian Kitten in Madurai`,
    description: `${kitten.name}, a ${kitten.breed} kitten at Mohammed Fazil Cattery in Madurai. Status: ${kitten.status}. Enquire directly on WhatsApp.`,
    alternates: { canonical: `/kittens/${kitten.id}` },
  };
}

const genderLabel: Record<string, string> = {
  male: "Male",
  female: "Female",
  unknown: "Not specified",
};

export default async function KittenDetailPage({ params }: Params) {
  const { id } = await params;
  const kitten = await getKitten(decodeURIComponent(id));
  if (!kitten) notFound();

  const age = ageFromDob(kitten.dateOfBirth);
  const bornOn = formatDate(kitten.dateOfBirth);

  const facts: Array<{ label: string; value: string }> = [
    { label: "Breed", value: kitten.breed },
    ...(kitten.gender !== "unknown"
      ? [{ label: "Gender", value: genderLabel[kitten.gender] ?? "Not specified" }]
      : []),
    ...(age ? [{ label: "Age", value: age }] : []),
    ...(bornOn ? [{ label: "Date of birth", value: bornOn }] : []),
    { label: "Availability", value: kitten.status },
    ...(kitten.price !== null && kitten.price !== undefined
      ? [{ label: "Price", value: `₹${kitten.price.toLocaleString("en-IN")}` }]
      : []),
  ];

  return (
    <div className="bg-cream" data-cat-mood="curious">
      <div className="container-x py-10 sm:py-14">
        <nav aria-label="Breadcrumb" className="mb-8">
          <Link
            href="/kittens"
            className="group inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-editorial text-navy/60 transition hover:text-navy"
          >
            <ArrowLeft
              className="h-4 w-4 transition duration-300 ease-editorial group-hover:-translate-x-1"
              aria-hidden="true"
            />
            All kittens
          </Link>
        </nav>

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <KittenGallery images={kitten.images} name={kitten.name} />
          </div>

          <div className="lg:col-span-5">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={kitten.status} />
              <Badge tone="neutral">{kitten.breed}</Badge>
              {kitten.placeholder ? <Badge tone="placeholder">Placeholder record</Badge> : null}
            </div>

            <h1 className="mt-5 text-balance font-serif text-display-lg text-navy">
              {kitten.name}
            </h1>

            <dl className="mt-8 divide-y divide-navy/10 border-y border-navy/10">
              {facts.map((fact) => (
                <div key={fact.label} className="flex items-center justify-between gap-4 py-3.5">
                  <dt className="text-[13px] text-navy/55">{fact.label}</dt>
                  <dd className="text-right text-[14.5px] font-semibold capitalize text-navy">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>

            {kitten.description ? (
              <div className="mt-7">
                <h2 className="text-[11px] font-bold uppercase tracking-editorial text-navy/55">
                  About this kitten
                </h2>
                <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-navy/72">
                  {kitten.description}
                </p>
              </div>
            ) : null}

            {kitten.placeholder ? (
              <p className="mt-6 rounded-md border border-dashed border-brown/40 bg-brown/8 px-4 py-3 text-[12.5px] leading-relaxed text-brown">
                This is placeholder content used during development. Real photographs, age and
                details replace it from the admin panel.
              </p>
            ) : null}

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <WhatsAppButton
                className="sm:flex-1"
                size="lg"
                message={messageForKitten(kitten.name)}
              >
                WhatsApp About This Kitten
              </WhatsAppButton>
              <CallButton size="lg" />
            </div>

            <p className="mt-6 flex items-start gap-2 text-[13px] leading-relaxed text-navy/55">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Availability is confirmed at the time of your conversation with the cattery.
            </p>

            <p className="mt-4 flex items-center gap-2 text-[13px] text-navy/55">
              <Cat className="h-4 w-4 shrink-0" aria-hidden="true" />
              Raised at Mohammed Fazil Cattery, Madurai.
            </p>

            <p className="mt-4 flex items-center gap-2 text-[13px] text-navy/55">
              <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
              Prefer to talk? Use the call button above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
