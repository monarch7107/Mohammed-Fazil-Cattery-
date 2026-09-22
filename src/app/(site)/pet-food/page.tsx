import type { Metadata } from "next";
import { PackageOpen } from "lucide-react";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductFilters } from "@/components/products/ProductFilters";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { EmptyState } from "@/components/sections/EmptyState";
import { WhatsAppButton } from "@/components/contact/ContactCtas";
import { listProducts } from "@/lib/data";
import { whatsappMessages } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cat & Dog Pet Food in Madurai | Mohammed Fazil Cattery",
  description:
    "Pet food for cats and dogs — dry and wet options available locally in Madurai. Ask Mohammed Fazil Cattery what is currently in stock.",
  alternates: { canonical: "/pet-food" },
};

interface Params {
  searchParams: Promise<{ animal?: string; category?: string }>;
}

export default async function PetFoodPage({ searchParams }: Params) {
  const params = await searchParams;
  const animal = params.animal === "cat" || params.animal === "dog" ? params.animal : "all";
  const category =
    params.category === "dry" || params.category === "wet" ? params.category : "all";

  const products = await listProducts({
    ...(animal !== "all" ? { animal } : {}),
    ...(category !== "all" ? { category } : {}),
  });

  const title =
    animal === "cat" ? "Cat Food" : animal === "dog" ? "Dog Food" : "Cat & Dog Food";

  const intent = animal === "cat" ? "cat-food" : animal === "dog" ? "dog-food" : "general";

  return (
    <>
      <section className="border-b border-line bg-cream" data-cat-mood="curious">
        <div className="container-x py-16 sm:py-20 lg:py-24">
          <p className="eyebrow">Pet food · Madurai</p>
          <div className="mt-5 grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <h1 className="text-balance font-serif text-display-xl text-navy">{title}</h1>
              <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-navy/70 sm:text-base">
                We keep pet food for cats and dogs alongside our Persian kittens. Brand, pack size
                and price are confirmed on WhatsApp because stock changes regularly.
              </p>
            </div>
            <div className="lg:col-span-5 lg:justify-self-end">
              <ProductFilters animal={animal} category={category} />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cream" aria-label="Pet food listings">
        <div className="container-x py-14 sm:py-16">
          {products.length > 0 ? (
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={PackageOpen}
              title="No products listed in this category yet"
              description="Stock changes often. Message us with what you need — cat food, dog food, dry or wet — and we will confirm what is available."
              action={<WhatsAppButton message={whatsappMessages[intent]} />}
            />
          )}
        </div>
      </section>

      <section className="bg-white">
        <div className="container-x py-16">
          <SectionHeading
            index="→"
            eyebrow="Local availability"
            title="Ask before you travel"
            description="Because this is a small local business, product availability moves quickly. A quick WhatsApp message saves you a wasted trip."
            actions={<WhatsAppButton size="sm" message={whatsappMessages[intent]} />}
          />
        </div>
      </section>
    </>
  );
}
