import Link from "next/link";
import { Phone } from "lucide-react";
import { contact, siteConfig } from "@/lib/site";
import { whatsappGeneralMessage } from "@/components/contact/ContactCtas";
import { WhatsAppIcon } from "@/components/brand/WhatsAppIcon";

/**
 * Mobile-only sticky contact bar.
 * Sits at the very bottom with safe-area padding; the cat companion and the
 * floating WhatsApp button are both positioned to stay clear of it.
 */
export function StickyContactBar() {
  if (!contact.hasPhone && !contact.hasWhatsApp) {
    return (
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-navy-800 bg-navy sm:hidden">
        <Link
          href="/contact"
          className="flex h-14 w-full items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider2 text-cream"
        >
          Enquire about kittens &amp; pet food
        </Link>
      </div>
    );
  }

  const waHref = contact.hasWhatsApp
    ? `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(whatsappGeneralMessage())}`
    : null;

  return (
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-navy-800 bg-navy sm:hidden">
      <div className="grid h-14 grid-cols-2 divide-x divide-navy-800">
        {contact.hasPhone ? (
          <a
            href={`tel:${siteConfig.phone.replace(/[^\d+]/g, "")}`}
            className="flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider2 text-cream transition active:bg-navy-800"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            Call
          </a>
        ) : (
          <Link
            href="/contact"
            className="flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider2 text-cream"
          >
            Contact
          </Link>
        )}

        {waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green text-sm font-bold uppercase tracking-wider2 text-white transition active:bg-green-800"
          >
            <WhatsAppIcon className="h-4.5 w-4.5" />
            WhatsApp
          </a>
        ) : (
          <Link
            href="/contact"
            className="flex items-center justify-center gap-2 bg-green text-sm font-bold uppercase tracking-wider2 text-white"
          >
            <WhatsAppIcon className="h-4.5 w-4.5" />
            WhatsApp
          </Link>
        )}
      </div>
    </div>
  );
}
