import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider2",
  {
    variants: {
      tone: {
        available: "border-green/30 bg-green/10 text-green",
        reserved: "border-brown/30 bg-brown/10 text-brown",
        sold: "border-navy/25 bg-navy/8 text-navy/70",
        placeholder: "border-dashed border-brown/40 bg-brown/8 text-brown",
        neutral: "border-navy/15 bg-cream-200 text-navy/70",
        dark: "border-cream/25 bg-cream/10 text-cream",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
