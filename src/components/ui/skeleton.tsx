import * as React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("relative overflow-hidden rounded-md bg-cream-200", className)}
    >
      <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </div>
  );
}

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-line bg-white shadow-card transition duration-500 ease-editorial",
        className
      )}
      {...props}
    />
  );
}

export function SectionLabel({
  index,
  children,
  tone = "navy",
  className,
}: {
  index?: string;
  children: React.ReactNode;
  tone?: "navy" | "cream";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3",
        tone === "cream" ? "text-cream/60" : "text-navy/50",
        className
      )}
    >
      {index ? (
        <span className="text-[11px] font-bold tabular-nums tracking-editorial">{index}</span>
      ) : null}
      <span className="h-px w-8 bg-current opacity-50" aria-hidden="true" />
      <span className="text-[11px] font-bold uppercase tracking-editorial">{children}</span>
    </div>
  );
}
