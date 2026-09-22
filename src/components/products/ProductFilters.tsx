"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type Animal = "all" | "cat" | "dog";
type Category = "all" | "dry" | "wet";

const animalOptions: Array<{ value: Animal; label: string }> = [
  { value: "all", label: "All pet food" },
  { value: "cat", label: "Cat food" },
  { value: "dog", label: "Dog food" },
];

const categoryOptions: Array<{ value: Category; label: string }> = [
  { value: "all", label: "All types" },
  { value: "dry", label: "Dry food" },
  { value: "wet", label: "Wet food" },
];

function buildHref(animal: Animal, category: Category): string {
  const params = new URLSearchParams();
  if (animal !== "all") params.set("animal", animal);
  if (category !== "all") params.set("category", category);
  const query = params.toString();
  return query ? `/pet-food?${query}` : "/pet-food";
}

export function ProductFilters({ animal, category }: { animal: Animal; category: Category }) {
  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Filter by animal" className="flex flex-wrap gap-2">
        {animalOptions.map((option) => {
          const active = option.value === animal;
          return (
            <Link
              key={option.value}
              href={buildHref(option.value, category)}
              aria-current={active ? "true" : undefined}
              className={cn(
                "inline-flex h-11 items-center rounded-full border px-6 text-[13.5px] font-semibold transition duration-300 ease-editorial",
                active
                  ? "border-navy bg-navy text-cream"
                  : "border-navy/20 text-navy/70 hover:border-navy/60 hover:text-navy"
              )}
            >
              {option.label}
            </Link>
          );
        })}
      </div>

      <div role="group" aria-label="Filter by food type" className="flex flex-wrap gap-2">
        {categoryOptions.map((option) => {
          const active = option.value === category;
          return (
            <Link
              key={option.value}
              href={buildHref(animal, option.value)}
              aria-current={active ? "true" : undefined}
              className={cn(
                "inline-flex h-10 items-center rounded-full border px-5 text-[13px] font-semibold transition duration-300 ease-editorial",
                active
                  ? "border-brown bg-brown text-white"
                  : "border-brown/25 text-brown/80 hover:border-brown hover:text-brown"
              )}
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
