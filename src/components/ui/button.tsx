import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold tracking-wide transition-all duration-300 ease-editorial focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:pointer-events-none disabled:opacity-55",
  {
    variants: {
      variant: {
        primary: "bg-navy text-cream hover:bg-brown shadow-pill hover:shadow-card",
        secondary:
          "border border-navy/25 bg-transparent text-navy hover:border-navy hover:bg-navy hover:text-cream",
        ghost: "text-navy hover:bg-navy/8",
        whatsapp: "bg-green text-white hover:bg-green-800 shadow-pill",
        cream: "bg-cream text-navy hover:bg-white shadow-pill",
        outlineLight:
          "border border-cream/35 text-cream hover:border-cream hover:bg-cream hover:text-navy",
        link: "text-navy underline-offset-4 hover:underline p-0 h-auto rounded-none",
      },
      size: {
        sm: "h-10 px-5 text-[13px]",
        md: "h-11 px-7",
        lg: "h-13 px-9 text-[15px] py-3.5",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
