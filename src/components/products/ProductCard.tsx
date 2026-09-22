import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/images/BusinessImage";
import { WhatsAppButton } from "@/components/contact/ContactCtas";
import { messageForProduct } from "@/lib/whatsapp";
import { formatINR } from "@/lib/utils";
import type { Product } from "@/models/types";

const animalLabel: Record<Product["animal"], string> = { cat: "Cat", dog: "Dog" };

export function ProductCard({ product }: { product: Product }) {
  const price = formatINR(product.price);
  const foodType = product.foodType || (product.category === "dry" ? "Dry Food" : "Wet Food");

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white shadow-card transition duration-500 ease-editorial hover:-translate-y-1 hover:shadow-card-hover">
      <ProductImage
        src={product.image}
        alt={`${product.name} — ${animalLabel[product.animal]} food`}
        ratio="aspect-[4/3]"
        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 28vw"
        variant={product.category === "wet" ? "food" : "product"}
      />

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-lg leading-snug text-navy">{product.name}</h3>
          <Badge tone={product.available ? "available" : "sold"} className="shrink-0">
            {product.available ? "Available" : "Unavailable"}
          </Badge>
        </div>

        <dl className="mt-4 space-y-2 text-[13px]">
          <div className="flex items-center justify-between gap-3 border-b border-navy/10 pb-2">
            <dt className="text-navy/50">For</dt>
            <dd className="font-semibold text-navy">{animalLabel[product.animal]} food</dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-navy/10 pb-2">
            <dt className="text-navy/50">Type</dt>
            <dd className="font-semibold text-navy">{foodType}</dd>
          </div>
          {product.brand ? (
            <div className="flex items-center justify-between gap-3 border-b border-navy/10 pb-2">
              <dt className="text-navy/50">Brand</dt>
              <dd className="font-semibold text-navy">{product.brand}</dd>
            </div>
          ) : null}
          {product.packSize ? (
            <div className="flex items-center justify-between gap-3 border-b border-navy/10 pb-2">
              <dt className="text-navy/50">Pack size</dt>
              <dd className="font-semibold text-navy">{product.packSize}</dd>
            </div>
          ) : null}
          {price ? (
            <div className="flex items-center justify-between gap-3 border-b border-navy/10 pb-2">
              <dt className="text-navy/50">Price</dt>
              <dd className="font-semibold text-navy">{price}</dd>
            </div>
          ) : null}
        </dl>

        {product.description ? (
          <p className="mt-4 text-[13px] leading-relaxed text-navy/65">{product.description}</p>
        ) : null}

        <div className="mt-auto pt-6">
          <WhatsAppButton
            className="w-full"
            size="sm"
            message={messageForProduct(product.name)}
          >
            Ask about this
          </WhatsAppButton>
          {product.placeholder ? (
            <p className="mt-3 text-center text-[11px] leading-relaxed text-brown">
              Placeholder record — no brand or price is claimed.
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
