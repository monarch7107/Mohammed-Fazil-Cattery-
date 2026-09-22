import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Kitten } from "@/models/types";
import { KittenImage } from "@/components/images/BusinessImage";
import { Badge } from "@/components/ui/badge";
import { ageFromDob } from "@/lib/utils";

const statusTone: Record<Kitten["status"], "available" | "reserved" | "sold"> = {
  available: "available",
  reserved: "reserved",
  sold: "sold",
};

const statusLabel: Record<Kitten["status"], string> = {
  available: "Available",
  reserved: "Reserved",
  sold: "Sold",
};

const genderLabel: Record<Kitten["gender"], string> = {
  male: "Male",
  female: "Female",
  unknown: "Not specified",
};

export function StatusBadge({ status, className }: { status: Kitten["status"]; className?: string }) {
  return (
    <Badge tone={statusTone[status]} className={className}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabel[status]}
    </Badge>
  );
}

export function KittenCard({ kitten, priority = false }: { kitten: Kitten; priority?: boolean }) {
  const href = `/kittens/${encodeURIComponent(kitten.id)}`;
  const age = ageFromDob(kitten.dateOfBirth);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white shadow-card transition duration-500 ease-editorial hover:-translate-y-1 hover:shadow-card-hover">
      <Link href={href} tabIndex={-1} aria-hidden="true" className="block">
        <KittenImage
          src={kitten.images[0]}
          alt={`${kitten.name} — Persian kitten at Mohammed Fazil Cattery`}
          ratio="aspect-[4/5]"
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 28vw"
          priority={priority}
        />
      </Link>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-xl leading-snug text-navy">
            <Link href={href} className="link-underline">
              {kitten.name}
            </Link>
          </h3>
          <StatusBadge status={kitten.status} className="shrink-0" />
        </div>

        <dl className="mt-4 space-y-2 text-[13px]">
          <div className="flex items-center justify-between gap-3 border-b border-navy/10 pb-2">
            <dt className="text-navy/50">Breed</dt>
            <dd className="font-semibold text-navy">{kitten.breed}</dd>
          </div>
          {kitten.gender !== "unknown" ? (
            <div className="flex items-center justify-between gap-3 border-b border-navy/10 pb-2">
              <dt className="text-navy/50">Gender</dt>
              <dd className="font-semibold text-navy">{genderLabel[kitten.gender]}</dd>
            </div>
          ) : null}
          {age ? (
            <div className="flex items-center justify-between gap-3 border-b border-navy/10 pb-2">
              <dt className="text-navy/50">Age</dt>
              <dd className="font-semibold text-navy">{age}</dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-auto flex items-center justify-between gap-3 pt-6">
          <span className="text-[11px] font-bold uppercase tracking-editorial text-navy/55 transition group-hover:text-brown">
            View profile
          </span>
          <ArrowRight
            className="h-4 w-4 text-navy/55 transition duration-500 ease-editorial group-hover:translate-x-1 group-hover:text-brown"
            aria-hidden="true"
          />
        </div>

        {kitten.placeholder ? (
          <p className="mt-4 rounded-md border border-dashed border-brown/40 bg-brown/8 px-3 py-2 text-[11px] leading-relaxed text-brown">
            Placeholder record — replace it from the admin panel.
          </p>
        ) : null}
      </div>
    </article>
  );
}
