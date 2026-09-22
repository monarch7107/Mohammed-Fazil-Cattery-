import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  tone = "light",
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-14 text-center",
        dark ? "border-cream/25 bg-cream/5 text-cream" : "border-navy/20 bg-white/60 text-navy",
        className
      )}
    >
      {Icon ? (
        <span
          aria-hidden="true"
          className={cn(
            "mb-5 flex h-12 w-12 items-center justify-center rounded-full",
            dark ? "bg-cream/10 text-cream/80" : "bg-cream-200 text-navy/60"
          )}
        >
          <Icon className="h-5.5 w-5.5" />
        </span>
      ) : null}
      <h3 className="font-serif text-xl">{title}</h3>
      {description ? (
        <p className={cn("mt-2 max-w-md text-sm leading-relaxed", dark ? "text-cream/65" : "text-navy/65")}>
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
