"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[cattery] page error", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-cream px-5 py-20 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-5 max-w-xl text-balance font-serif text-display-lg text-navy">
        We hit a temporary problem.
      </h1>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-navy/65">
        Nothing is lost — please try again. If it keeps happening, reach out to us on WhatsApp and
        we will help directly.
      </p>
      <div className="mt-8">
        <Button onClick={reset}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </Button>
      </div>
    </div>
  );
}
