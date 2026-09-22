"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { contact, navLinks, siteConfig } from "@/lib/site";
import { WhatsAppButton } from "@/components/contact/ContactCtas";
import { WhatsAppIcon } from "@/components/brand/WhatsAppIcon";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const scrollLocked = useRef(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (open && !scrollLocked.current) {
      document.body.style.overflow = "hidden";
      scrollLocked.current = true;
      firstLinkRef.current?.focus();
    } else if (!open && scrollLocked.current) {
      document.body.style.overflow = "";
      scrollLocked.current = false;
    }
    return () => {
      if (!open && scrollLocked.current) {
        document.body.style.overflow = "";
        scrollLocked.current = false;
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-cream/90 backdrop-blur-md">
      <div className="container-x flex h-16 items-center justify-between gap-6 sm:h-20">
        <Logo />

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {navLinks.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "link-underline text-[12.5px] font-bold uppercase tracking-wider2 transition-colors",
                      active ? "text-brown" : "text-navy/70 hover:text-navy"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <WhatsAppButton className="hidden md:inline-flex" size="sm" />

          {contact.hasWhatsApp ? (
            <a
              href={`https://wa.me/${siteConfig.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp Mohammed Fazil Cattery"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-green text-white transition hover:bg-green-800 md:hidden"
            >
              <WhatsAppIcon className="h-5 w-5" />
            </a>
          ) : null}

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-navy/20 text-navy transition hover:bg-navy/8 lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation */}
      <div
        id="mobile-navigation"
        ref={panelRef}
        hidden={!open}
        className="absolute inset-x-0 top-full max-h-[calc(100dvh-5.5rem)] overflow-y-auto border-b border-line bg-cream shadow-card-hover lg:hidden"
      >
        <nav aria-label="Mobile" className="container-x py-6">
          <ul className="flex flex-col">
            {navLinks.map((link, index) => {
              const active = isActive(pathname, link.href);
              return (
                <li key={link.href} className="border-b border-navy/10 last:border-b-0">
                  <Link
                    ref={index === 0 ? firstLinkRef : undefined}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center justify-between py-4 font-serif text-2xl transition-colors",
                      active ? "text-brown" : "text-navy hover:text-brown"
                    )}
                  >
                    {link.label}
                    <span aria-hidden="true" className="text-sm text-navy/35">
                      0{index + 1}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 flex flex-col gap-3">
            <WhatsAppButton className="w-full" size="lg" />
            <Link
              href="/admin"
              className="text-center text-[11px] font-semibold uppercase tracking-editorial text-navy/45 transition hover:text-navy"
            >
              Admin sign in
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
