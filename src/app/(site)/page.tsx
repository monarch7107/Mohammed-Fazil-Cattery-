import type { Metadata } from "next";
import { Hero } from "@/components/hero/Hero";
import { AboutIntro } from "@/components/sections/AboutIntro";
import { FeaturedKittens } from "@/components/sections/FeaturedKittens";
import { WhyChooseUs } from "@/components/sections/WhyChooseUs";
import { PetFoodSection } from "@/components/sections/PetFoodSection";
import { GalleryPreview } from "@/components/sections/GalleryPreview";
import { EnquiryProcess } from "@/components/sections/EnquiryProcess";
import { LocationSection } from "@/components/sections/LocationSection";
import { InstagramSection } from "@/components/sections/InstagramSection";
import { FinalCta } from "@/components/sections/FinalCta";
import { listAvailableKittens, listGallery } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mohammed Fazil Cattery | Persian Kittens & Pet Food in Madurai",
  description:
    "Persian kittens raised with care in Madurai, plus pet food for cats and dogs. Enquire directly with Mohammed Fazil on WhatsApp or by phone.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [kittens, gallery] = await Promise.all([listAvailableKittens(4), listGallery()]);

  return (
    <>
      <Hero />
      <AboutIntro />
      <FeaturedKittens kittens={kittens} />
      <WhyChooseUs />
      <PetFoodSection />
      <GalleryPreview items={gallery.slice(0, 5)} />
      <EnquiryProcess />
      <LocationSection />
      <InstagramSection />
      <FinalCta />
    </>
  );
}
