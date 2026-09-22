"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Images, Package, Cat, ExternalLink } from "lucide-react";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/kittens", label: "Kittens", icon: Cat },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/gallery", label: "Gallery", icon: Images },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="flex items-center gap-1 sm:gap-2">
      <ul className="flex items-center gap-1 overflow-x-auto">
        {links.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full px-3 text-[13px] font-semibold transition sm:px-4",
                  active ? "bg-navy text-cream" : "text-navy/65 hover:bg-navy/8 hover:text-navy"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <Link
        href="/"
        target="_blank"
        rel="noreferrer"
        className="ml-1 hidden h-10 items-center gap-2 rounded-full border border-navy/20 px-4 text-[13px] font-semibold text-navy/70 transition hover:border-navy hover:text-navy md:inline-flex"
      >
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
        View site
      </Link>

      <SignOutButton />
    </nav>
  );
}
