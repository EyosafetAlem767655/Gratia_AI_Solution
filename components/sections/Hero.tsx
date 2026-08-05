import { Magnetic } from "@/components/ui/Magnetic";
import { Marquee } from "@/components/ui/Marquee";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { INDUSTRY_INFO, type Industry } from "@/lib/types";

const industries = Object.keys(INDUSTRY_INFO) as Industry[];

export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden pt-32"
    >
      <div className="scrim" aria-hidden />

      <div className="relative z-10 mx-auto grid w-full max-w-[80rem] flex-1 grid-cols-12 items-center gap-y-10 px-[var(--gutter)]">
        <div className="col-span-12 lg:col-span-7 xl:col-span-6">
          <Reveal y={14} className="flex items-center gap-3">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-molten opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-molten" />
            </span>
            <span className="tag">Enterprise AI · Engineered</span>
          </Reveal>

          <h1 className="mt-7 text-[clamp(3rem,9.5vw,7.5rem)] font-semibold">
            <RevealText
              as="span"
              text="Intelligence,"
              className="chrome-type block"
              delay={0.05}
            />
            <RevealText
              as="span"
              text="forged."
              className="molten-type block"
              delay={0.18}
            />
          </h1>

          <Reveal delay={0.45} y={26}>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-chrome-dim">
              We design, build and ship production AI for the industries that
              run the world — industrial, financial, manufacturing, real estate
              and e-commerce. From the first prototype to the system that runs
              on Monday morning.
            </p>
          </Reveal>

          <Reveal delay={0.58} y={22}>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Magnetic>
                <a href="#contact" className="btn btn-molten" data-cursor="link">
                  Start a project
                  <Arrow />
                </a>
              </Magnetic>
              <a href="#work" className="btn btn-ghost" data-cursor="link">
                See the work
              </a>
            </div>
          </Reveal>
        </div>

        {/* Instrument readout. The rest of this column is deliberately empty so
            the forge in the WebGL layer has somewhere to live. */}
        <Reveal
          delay={0.8}
          y={0}
          className="col-span-12 hidden lg:col-span-5 lg:block xl:col-span-6"
        >
          <dl className="ml-auto w-fit space-y-4 border-l border-[#1a212c] pl-6">
            {[
              ["Practice", "Applied AI systems"],
              ["Engagement", "Prototype → Production"],
              ["Sectors", "Five, plus bespoke"],
            ].map(([term, value]) => (
              <div key={term}>
                <dt className="tag">{term}</dt>
                <dd className="mt-1 font-mono text-sm text-chrome">{value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>

      <div className="relative z-10 w-full">
        <div className="hairline" />
        <Marquee
          className="py-4 text-[0.7rem] uppercase tracking-[0.28em] text-[#5d6d80]"
          items={[
            ...industries.map((key) => INDUSTRY_INFO[key].label),
            "Prototype → Production",
            "Evaluation & Guardrails",
            "Bespoke Architectures",
          ]}
        />
        <div className="hairline" />
      </div>

      <ScrollCue />
    </section>
  );
}

function ScrollCue() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute bottom-28 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex"
    >
      <span className="tag text-[0.6rem]">Scroll</span>
      <span className="relative block h-10 w-px overflow-hidden bg-[#1a212c]">
        <span className="absolute inset-x-0 top-0 h-4 animate-[cue_2.2s_ease-in-out_infinite] bg-molten" />
      </span>
    </div>
  );
}

function Arrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
