import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  tone = "navy",
  compact = false,
  href = "/",
}: {
  className?: string;
  tone?: "navy" | "cream";
  compact?: boolean;
  href?: string;
}) {
  const ink = tone === "cream" ? "text-cream" : "text-navy";
  const sub = tone === "cream" ? "text-cream/60" : "text-brown";
  const ringColor = tone === "cream" ? "border-cream/30" : "border-navy/25";

  return (
    <Link
      href={href}
      aria-label={`${siteConfig.name} — home`}
      className={cn("group flex items-center gap-3", className)}
    >
      <span className={cn("relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-transform duration-500 ease-editorial group-hover:rotate-[-8deg] sm:h-11 sm:w-11", ringColor)}>
        <svg viewBox="0 0 64 64" className={cn("h-7 w-7 sm:h-8 sm:w-8", ink)} aria-hidden="true">
          <g fill="currentColor">
            <path d="M20.5 24.5c-.6-4.4-.3-8.3.8-11.4.5-1.4 2-1.9 3.2-1l5.1 3.9a15.5 15.5 0 0 1 4.9-.8c1.8 0 3.5.3 5.1.8l5.1-3.9c1.2-.9 2.7-.4 3.2 1 1.1 3.1 1.4 7 .8 11.4 1.6 2.4 2.5 5.2 2.5 8.2 0 8.8-7.9 15.8-17.6 15.8S18 41.5 18 32.7c0-3 .9-5.8 2.5-8.2Z" />
          </g>
          <g className="fill-cream" data-eyes>
            <ellipse cx="26.5" cy="31.5" rx="2.1" ry="2.6" />
            <ellipse cx="37.5" cy="31.5" rx="2.1" ry="2.6" />
          </g>
          <path
            d="M27.4 43.4c1.4 1.1 3 1.7 4.6 1.7s3.2-.6 4.6-1.7"
            stroke="currentColor"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className={cn("font-serif text-[15px] font-semibold tracking-wide sm:text-base", ink)}>
          Mohammed Fazil
        </span>
        <span className={cn("mt-1 text-[9.5px] font-bold uppercase tracking-editorial sm:text-[10px]", sub)}>
          Cattery · Madurai
        </span>
      </span>
    </Link>
  );
}
