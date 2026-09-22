import { SectionHeading } from "@/components/sections/SectionHeading";

const steps = [
  {
    title: "Browse",
    body: "Look through the kittens and pet food listed on this website.",
  },
  {
    title: "Ask",
    body: "Send a WhatsApp message or call — it goes straight to Mohammed Fazil.",
  },
  {
    title: "Discuss",
    body: "We answer your questions about the kitten, food, availability and next steps.",
  },
  {
    title: "Arrange next step",
    body: "If it is the right fit, we agree on a convenient way to take it forward.",
  },
];

export function EnquiryProcess() {
  return (
    <section className="bg-cream" data-cat-mood="attentive" aria-labelledby="process-heading">
      <div className="container-x py-20 sm:py-24 lg:py-28">
        <div id="process-heading">
          <SectionHeading
            index="06"
            eyebrow="How it works"
            title="Four Simple Steps"
            description="No accounts, no checkout, no waiting. Enquiring takes a minute."
          />
        </div>

        <ol className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title} className="group relative bg-cream p-7 transition hover:bg-white sm:p-8">
              <span
                aria-hidden="true"
                className="block font-serif text-3xl text-brown/60 transition group-hover:text-brown"
              >
                0{index + 1}
              </span>
              <h3 className="mt-4 font-serif text-xl text-navy">{step.title}</h3>
              <p className="mt-2.5 text-[14px] leading-relaxed text-navy/65">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
