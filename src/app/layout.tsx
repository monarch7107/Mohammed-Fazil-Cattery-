import type { Metadata, Viewport } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/lib/site";
import { AppProviders } from "@/components/providers/AppProviders";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | Persian Kittens & Pet Food in Madurai`,
    template: `%s | ${siteConfig.name}`,
  },
  description:
    "Mohammed Fazil Cattery is a Madurai-based cattery raising Persian kittens and supplying pet food for cats and dogs. Enquire directly on WhatsApp or call.",
  applicationName: siteConfig.name,
  keywords: [
    "Persian kittens Madurai",
    "cattery Madurai",
    "Persian cat breeder Madurai",
    "pet food Madurai",
    "cat food Madurai",
    "dog food Madurai",
    "Mohammed Fazil Cattery",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} | Persian Kittens & Pet Food in Madurai`,
    description:
      "Persian kittens raised with care in Madurai, plus pet food for cats and dogs. Enquire directly with Mohammed Fazil.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | Persian Kittens & Pet Food in Madurai`,
    description:
      "Persian kittens raised with care in Madurai, plus pet food for cats and dogs. Enquire directly with Mohammed Fazil.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#F8F3EA",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-cream text-ink">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
