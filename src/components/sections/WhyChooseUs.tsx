import { SectionHeading } from "@/components/sections/SectionHeading";

const reasons = [
  {
    title: "Persian cats, raised here",
    body: "Our focus is Persian cats and Persian kittens, raised and socialised in our own cattery — not sourced from anywhere else.",
  },
  {
    title: "A local Madurai business",
    body: "We are based in Madurai and serve families here. You can talk to us, ask questions and decide comfortably.",
  },
  {
    title: "Pet food when you need it",
    body: "We also keep pet food for cats and dogs, so a single enquiry can cover both your kitten and your pantry.",
  },
  {
    title: "Direct communication",
    body: "Every enquiry goes straight to Mohammed Fazil on WhatsApp or phone. No forms lost in a queue, no third-party sellers.",
  },
];

export function WhyChooseUs() {
  return (
    <section className="bg-white" data-cat-mood="calm" aria-labelledby="why-heading">
      <div className="container-x py-20 sm:py-24 lg:py-28">
        <div id="why-heading">
          <SectionHeading
            index="03"
            eyebrow="Why people choose us"
            title="Small Scale, Serious Care"
            description="We keep the operation small on purpose. It is the only way to raise kittens properly."
          />
        </div>

        <ol className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2">
          {reasons.map((reason, index) => (
            <li key={reason.title} className="flex gap-6 border-t border-navy/12 pt-6">
              <span
                aria-hidden="true"
                className="font-serif text-2xl tabular-nums text-brown/70"
              >
                0{index + 1}
              </span>
              <div>
                <h3 className="font-serif text-xl text-navy">{reason.title}</h3>
                <p className="mt-2.5 max-w-md text-[14.5px] leading-relaxed text-navy/65">
                  {reason.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
