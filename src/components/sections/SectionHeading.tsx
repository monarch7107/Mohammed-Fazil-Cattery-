import { cn } from "@/lib/utils";
import { SectionLabel } from "@/components/ui/skeleton";

export function SectionHeading({
  id,
  index,
  eyebrow,
  title,
  description,
  align = "left",
  tone = "navy",
  className,
  actions,
}: {
  id?: string;
  index?: string;
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  tone?: "navy" | "cream";
  className?: string;
  actions?: React.ReactNode;
}) {
  const centered = align === "center";

  return (
    <div
      className={cn(
        "flex flex-col gap-5",
        centered && "items-center text-center",
        actions && "lg:flex-row lg:items-end lg:justify-between",
        className
      )}
    >
      <div className={cn("max-w-2xl", centered && "mx-auto")}>
        {eyebrow ? (
          <SectionLabel index={index} tone={tone}>
            {eyebrow}
          </SectionLabel>
        ) : null}
        <h2
          id={id}
          className={cn(
            "mt-5 text-balance font-serif text-display-lg",
            tone === "cream" ? "text-cream" : "text-navy"
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              "mt-5 max-w-2xl text-[15px] leading-relaxed sm:text-base",
              tone === "cream" ? "text-cream/70" : "text-navy/70"
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
