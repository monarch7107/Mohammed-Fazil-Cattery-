import Link from "next/link";
import { Instagram, MapPin, Phone } from "lucide-react";
import { contact, siteConfig } from "@/lib/site";
import { directionsLink, instagramLink, telLink, whatsappLink } from "@/lib/whatsapp";
import { Button, type ButtonProps } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/brand/WhatsAppIcon";
import { cn } from "@/lib/utils";

type CommonProps = {
  message?: string;
  children?: React.ReactNode;
  className?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
};

/**
 * WhatsApp CTA.
 * When no number is configured the button degrades to the contact page
 * instead of rendering a dead link — nothing is invented.
 */
export function WhatsAppButton({
  message,
  children,
  className,
  size,
  variant = "whatsapp",
}: CommonProps) {
  const href = whatsappLink(message ?? "Hello, I'd like to know more about Mohammed Fazil Cattery.");

  if (!href) {
    return (
      <Button asChild variant="secondary" size={size} className={className}>
        <Link href="/contact">WhatsApp Us</Link>
      </Button>
    );
  }

  return (
    <Button asChild variant={variant} size={size} className={className}>
      <a href={href} target="_blank" rel="noopener noreferrer">
        <WhatsAppIcon className="h-4.5 w-4.5" />
        {children ?? "WhatsApp Us"}
      </a>
    </Button>
  );
}

export function CallButton({ children, className, size, variant = "secondary" }: CommonProps) {
  const href = telLink();

  if (!href) {
    return (
      <Button asChild variant="ghost" size={size} className={className}>
        <Link href="/contact">Contact for enquiries</Link>
      </Button>
    );
  }

  return (
    <Button asChild variant={variant} size={size} className={className}>
      <a href={href}>
        <Phone className="h-4 w-4" aria-hidden="true" />
        {children ?? "Call Now"}
      </a>
    </Button>
  );
}

export function InstagramLink({ className }: { className?: string }) {
  const href = instagramLink();
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-2 text-sm font-semibold text-navy/70 transition hover:text-brown",
        className
      )}
    >
      <Instagram className="h-4 w-4" aria-hidden="true" />
      Instagram
    </a>
  );
}

export function DirectionsLink({ className }: { className?: string }) {
  const href = directionsLink();
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-2 text-sm font-semibold text-navy/70 transition hover:text-brown",
        className
      )}
    >
      <MapPin className="h-4 w-4" aria-hidden="true" />
      Get directions
    </a>
  );
}

/**
 * Floating WhatsApp button — desktop/tablet.
 * Mobile uses the sticky bottom contact bar instead, so the two never
 * compete for the same corner or cover the cat companion.
 */
export function FloatingWhatsApp({ message }: { message?: string }) {
  if (!contact.hasWhatsApp) return null;
  const href = whatsappLink(message ?? whatsappGeneralMessage());

  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Mohammed Fazil Cattery on WhatsApp"
      className="group fixed bottom-6 right-6 z-50 hidden h-14 w-14 items-center justify-center rounded-full bg-green text-white shadow-pill transition duration-300 ease-editorial hover:scale-105 hover:bg-green-800 sm:inline-flex"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 animate-ping rounded-full bg-green/35"
      />
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}

export function whatsappGeneralMessage() {
  return "Hello, I'd like to know more about Mohammed Fazil Cattery.";
}

export function LocationLine({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
      {siteConfig.city}
    </span>
  );
}
