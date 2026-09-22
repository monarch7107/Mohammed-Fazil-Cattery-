import Link from "next/link";
import { Instagram, MapPin, Phone } from "lucide-react";
import { contact, navLinks, siteConfig } from "@/lib/site";
import { whatsappGeneralMessage } from "@/components/contact/ContactCtas";
import { WhatsAppIcon } from "@/components/brand/WhatsAppIcon";
import { Logo } from "@/components/brand/Logo";

export function SiteFooter() {
  const year = new Date().getFullYear();
  const waHref = contact.hasWhatsApp
    ? `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(whatsappGeneralMessage())}`
    : null;

  return (
    <footer className="on-dark bg-navy text-cream">
      <div className="container-x grid gap-12 py-16 sm:py-20 md:grid-cols-12">
        <div className="md:col-span-5">
          <Logo tone="cream" />
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-cream/70">
            A small, Madurai-based cattery run by Mohammed Fazil — raising Persian kittens and
            supplying pet food for cats and dogs. Enquiries are handled directly, one conversation
            at a time.
          </p>
          <p className="mt-6 text-[11px] font-bold uppercase tracking-editorial text-cream/45">
            Persian Cats · Persian Kittens · Cat &amp; Dog Food
          </p>
        </div>

        <nav aria-label="Footer" className="md:col-span-3">
          <h2 className="text-[11px] font-bold uppercase tracking-editorial text-cream/45">
            Explore
          </h2>
          <ul className="mt-5 space-y-3">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-cream/75 transition hover:text-cream"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-4">
          <h2 className="text-[11px] font-bold uppercase tracking-editorial text-cream/45">
            Contact
          </h2>
          <ul className="mt-5 space-y-4 text-sm text-cream/75">
            <li className="flex items-center gap-2.5">
              <MapPin className="h-4 w-4 shrink-0 text-brown-200" aria-hidden="true" />
              {siteConfig.city}
            </li>
            {contact.hasPhone ? (
              <li>
                <a
                  href={`tel:${siteConfig.phone.replace(/[^\d+]/g, "")}`}
                  className="flex items-center gap-2.5 transition hover:text-cream"
                >
                  <Phone className="h-4 w-4 shrink-0 text-brown-200" aria-hidden="true" />
                  {siteConfig.phone}
                </a>
              </li>
            ) : null}
            {waHref ? (
              <li>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 transition hover:text-cream"
                >
                  <WhatsAppIcon className="h-4 w-4 text-brown-200" />
                  Chat on WhatsApp
                </a>
              </li>
            ) : null}
            {contact.hasInstagram ? (
              <li>
                <a
                  href={siteConfig.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 transition hover:text-cream"
                >
                  <Instagram className="h-4 w-4 shrink-0 text-brown-200" aria-hidden="true" />
                  Instagram
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="border-t border-cream/12">
        <div className="container-x flex flex-col items-start justify-between gap-3 py-6 text-[11.5px] text-cream/55 sm:flex-row sm:items-center">
          <p>
            © {year} {siteConfig.name} · Owner: {siteConfig.owner}
          </p>
          <div className="flex items-center gap-5">
            <span>{siteConfig.city}</span>
            <Link href="/admin" className="transition hover:text-cream">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
