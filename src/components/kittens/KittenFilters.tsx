"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { KITTEN_STATUSES, type KittenStatus } from "@/models/types";

type Filter = "all" | KittenStatus;

const labels: Record<Filter, string> = {
  all: "All",
  available: "Available",
  reserved: "Reserved",
  sold: "Sold",
};

export function KittenFilters({ active }: { active: Filter }) {
  const options: Filter[] = ["all", ...KITTEN_STATUSES];

  return (
    <div
      role="group"
      aria-label="Filter kittens by availability"
      className="flex flex-wrap items-center gap-2"
    >
      {options.map((option) => {
        const isActive = option === active;
        const href = option === "all" ? "/kittens" : `/kittens?status=${option}`;
        return (
          <Link
            key={option}
            href={href}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "inline-flex h-10 items-center rounded-full border px-5 text-[13px] font-semibold transition duration-300 ease-editorial",
              isActive
                ? "border-navy bg-navy text-cream"
                : "border-navy/20 text-navy/70 hover:border-navy/60 hover:text-navy"
            )}
          >
            {labels[option]}
          </Link>
        );
      })}
    </div>
  );
}
