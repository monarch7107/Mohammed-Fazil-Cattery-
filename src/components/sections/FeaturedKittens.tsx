import Link from "next/link";
import { ArrowRight, Cat } from "lucide-react";
import type { Kitten } from "@/models/types";
import { KittenCard } from "@/components/kittens/KittenCard";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { EmptyState } from "@/components/sections/EmptyState";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/contact/ContactCtas";
import { whatsappMessages } from "@/lib/whatsapp";

export function FeaturedKittens({ kittens }: { kittens: Kitten[] }) {
  const available = kittens.filter((kitten) => kitten.status === "available");
  const shown = (available.length > 0 ? available : kittens).slice(0, 4);

  return (
    <section
      className="bg-cream"
      data-cat-mood="curious"
      aria-labelledby="featured-kittens-heading"
    >
      <div className="container-x py-20 sm:py-24 lg:py-28">
        <div id="featured-kittens-heading">
          <SectionHeading
            index="02"
            eyebrow="Currently with us"
            title="Meet Our Available Kittens"
            description="Each kitten is raised in our home cattery in Madurai. Availability changes often — the quickest way to know what's new is to ask us directly."
            actions={
              <Button asChild variant="secondary">
                <Link href="/kittens">
                  View all kittens
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            }
          />
        </div>

        <div className="mt-12">
          {shown.length > 0 ? (
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {shown.map((kitten, index) => (
                <li key={kitten.id}>
                  <KittenCard kitten={kitten} priority={index < 2} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Cat}
              title="No kittens are listed right now"
              description="Litters are small and availability changes quickly. Send us a message and we'll let you know what's expected next."
              action={<WhatsAppButton message={whatsappMessages.kitten} />}
            />
          )}
        </div>
      </div>
    </section>
  );
}
