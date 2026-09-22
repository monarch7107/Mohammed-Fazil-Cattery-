import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-md border border-navy/20 bg-white px-4 text-sm text-ink placeholder:text-navy/40 transition focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/15 disabled:opacity-60",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-28 w-full rounded-md border border-navy/20 bg-white px-4 py-3 text-sm text-ink placeholder:text-navy/40 transition focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/15 disabled:opacity-60",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
