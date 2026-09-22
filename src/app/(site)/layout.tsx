import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { StickyContactBar } from "@/components/layout/StickyContactBar";
import { FloatingWhatsApp } from "@/components/contact/ContactCtas";
import { StructuredData } from "@/components/seo/StructuredData";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <main id="main-content" className="min-h-[60vh]">
        {children}
      </main>
      <SiteFooter />
      <StickyContactBar />
      <FloatingWhatsApp />
      <StructuredData />
      {/* Mobile sticky bar reserves space at the bottom of every page. */}
      <div aria-hidden="true" className="h-14 sm:hidden" />
    </>
  );
}
