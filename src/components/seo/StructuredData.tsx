import { contact, siteConfig } from "@/lib/site";

/**
 * Accurate structured data only: no invented ratings, reviews, addresses,
 * opening hours or aggregates.
 */
export function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "PetStore"],
    name: siteConfig.name,
    description:
      "Madurai-based cattery raising Persian kittens and supplying pet food for cats and dogs.",
    url: siteConfig.url,
    founder: siteConfig.owner,
    areaServed: {
      "@type": "City",
      name: siteConfig.cityShort,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: siteConfig.cityShort,
      addressRegion: "Tamil Nadu",
      addressCountry: "IN",
    },
    ...(contact.hasPhone ? { telephone: siteConfig.phone } : {}),
    ...(contact.hasInstagram ? { sameAs: [siteConfig.instagram] } : {}),
    makesOffer: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Persian kitten enquiries" } },
      { "@type": "Offer", itemOffered: { "@type": "Product", name: "Cat food" } },
      { "@type": "Offer", itemOffered: { "@type": "Product", name: "Dog food" } },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
