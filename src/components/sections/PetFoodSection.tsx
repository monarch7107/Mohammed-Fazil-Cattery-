import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { BusinessImage } from "@/components/images/BusinessImage";
import { WhatsAppButton } from "@/components/contact/ContactCtas";
import { whatsappMessages } from "@/lib/whatsapp";

const categories = [
  {
    key: "cat" as const,
    title: "Cat Food",
    body: "Dry and wet food options for cats — ask us what is currently in stock in Madurai.",
    variant: "product" as const,
    label: "Cat Food Product",
    message: whatsappMessages["cat-food"],
  },
  {
    key: "dog" as const,
    title: "Dog Food",
    body: "Dry and wet food options for dogs, available for local pickup through the cattery.",
    variant: "food" as const,
    label: "Dog Food Product",
    message: whatsappMessages["dog-food"],
  },
];

export function PetFoodSection() {
  return (
    <section className="bg-cream" data-cat-mood="curious" aria-labelledby="pet-food-heading">
      <div className="container-x py-20 sm:py-24 lg:py-28">
        <div id="pet-food-heading">
          <SectionHeading
            index="04"
            eyebrow="Pet food"
            title="Food For Cats & Dogs"
            description="Alongside our Persian kittens, we keep pet food for cats and dogs for customers in Madurai. Availability and pricing are confirmed on WhatsApp."
            actions={
              <Link
                href="/pet-food"
                className="group inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-editorial text-navy transition hover:text-brown"
              >
                Browse pet food
                <ArrowRight
                  className="h-4 w-4 transition duration-500 ease-editorial group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            }
          />
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {categories.map((category) => (
            <article
              key={category.key}
              className="group overflow-hidden rounded-xl border border-line bg-white shadow-card transition duration-500 ease-editorial hover:-translate-y-1 hover:shadow-card-hover"
            >
              <BusinessImage
                src={null}
                alt={`${category.title} available at Mohammed Fazil Cattery`}
                label={category.label}
                variant={category.variant}
                ratio="aspect-[16/9]"
                sizes="(max-width: 768px) 100vw, 45vw"
              />
              <div className="flex flex-col gap-4 p-6 sm:p-7">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-serif text-2xl text-navy">{category.title}</h3>
                  <span className="text-[10.5px] font-bold uppercase tracking-editorial text-brown">
                    Madurai
                  </span>
                </div>
                <p className="text-[14.5px] leading-relaxed text-navy/65">{category.body}</p>
                <div className="mt-2 flex flex-wrap gap-3">
                  <WhatsAppButton size="sm" message={category.message}>
                    Enquire
                  </WhatsAppButton>
                  <Link
                    href={`/pet-food?animal=${category.key}`}
                    className="inline-flex h-10 items-center rounded-full border border-navy/25 px-5 text-[13px] font-semibold text-navy transition hover:border-navy hover:bg-navy hover:text-cream"
                  >
                    See {category.title.toLowerCase()} listing
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
