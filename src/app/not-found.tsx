import Link from "next/link";
import { Cat, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/contact/ContactCtas";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center bg-cream px-5 py-20 text-center">
      <p className="eyebrow">404 · Page not found</p>

      <div className="mt-8 flex items-center gap-4" aria-hidden="true">
        <span className="font-serif text-7xl text-navy/25">4</span>
        <Cat className="h-14 w-14 text-brown/70" />
        <span className="font-serif text-7xl text-navy/25">4</span>
      </div>

      <h1 className="mt-6 max-w-xl text-balance font-serif text-display-lg text-navy">
        This page has wandered off.
      </h1>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-navy/65">
        The link may be old, or the kitten you were looking for has a new page. Everything on the
        site is just a click away.
      </p>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/">
            <Home className="h-4 w-4" aria-hidden="true" />
            Back to home
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/kittens">View kittens</Link>
        </Button>
        <WhatsAppButton variant="whatsapp" size="md" />
      </div>
    </div>
  );
}
