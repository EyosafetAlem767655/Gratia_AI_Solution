import { INDUSTRY_INFO, type Industry } from "@/lib/types";
import { Reveal } from "@/components/ui/Reveal";

const industries = Object.keys(INDUSTRY_INFO) as Industry[];

export function Services() {
  return (
    <section
      id="services"
      className="relative min-h-screen px-6 py-24"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="text-center text-3xl font-bold text-[#F4EDE4] sm:text-5xl">
            What We Build
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-[#A8C5A0]">
            Tailored AI solutions carved for every industry we serve — from
            factory floors to financial markets.
          </p>
        </Reveal>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {industries.map((key) => {
            const info = INDUSTRY_INFO[key];
            return (
              <article
                key={key}
                className="group rounded-2xl border border-[#4A7C59]/30 bg-[#1B3A1A]/60 p-6 backdrop-blur-md transition hover:border-[#C9A961]/50 hover:bg-[#2D4A2A]/80"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#8B5E3C]/30 text-xl text-[#C9A961]">
                  {info.shape === "gear" && "⚙"}
                  {info.shape === "chart" && "◆"}
                  {info.shape === "factory" && "▣"}
                  {info.shape === "building" && "▲"}
                  {info.shape === "cart" && "◫"}
                </div>
                <h3 className="text-xl font-semibold text-[#C9A961]">
                  {info.label}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#F4EDE4]/80">
                  {info.description}
                </p>
              </article>
            );
          })}
          <article className="rounded-2xl border border-dashed border-[#4A7C59]/40 bg-[#1B3A1A]/40 p-6 backdrop-blur-md sm:col-span-2 lg:col-span-1">
            <h3 className="text-xl font-semibold text-[#C9A961]">
              Custom Solutions
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#F4EDE4]/80">
              Every tree grows differently. We design bespoke AI architectures
              for unique business challenges across any sector.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
