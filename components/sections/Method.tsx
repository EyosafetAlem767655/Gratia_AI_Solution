import { Reveal, RevealText } from "@/components/ui/Reveal";

const STEPS = [
  {
    n: "01",
    title: "Diagnose",
    body: "We sit with your data and the people who actually operate the process. Most of what looks like an AI problem turns out to be a measurement problem first.",
  },
  {
    n: "02",
    title: "Prototype",
    body: "A working model against your real data — not a demo on a public dataset. You see the honest ceiling of the approach before anyone commits a budget to it.",
  },
  {
    n: "03",
    title: "Harden",
    body: "Evaluation suites, guardrails, monitoring, fallbacks. The unglamorous half that decides whether a model survives contact with production.",
  },
  {
    n: "04",
    title: "Operate",
    body: "We stay on after launch: retraining, drift, incident response, and the next slice of the roadmap once the first one is earning its keep.",
  },
];

export function Method() {
  return (
    <section
      id="method"
      className="relative px-[var(--gutter)] py-[var(--section-y)]"
    >
      <div className="scrim scrim-dense" aria-hidden />

      <div className="relative z-10 mx-auto max-w-[80rem]">
        <Reveal y={16}>
          <span className="tag">02 — Method</span>
        </Reveal>
        <RevealText
          as="h2"
          text="Four movements from problem to production."
          className="chrome-type mt-5 block max-w-3xl text-[clamp(2rem,4.6vw,3.8rem)] font-semibold"
        />

        <div className="relative mt-20">
          {/* The rail the steps hang from. */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-[13px] hidden h-px bg-gradient-to-r from-transparent via-[#232c3a] to-transparent lg:block"
          />

          <ol className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} as="li" delay={i * 0.09} y={28}>
                <div className="relative">
                  <span
                    aria-hidden
                    className="absolute -top-[19px] left-0 hidden h-1.5 w-1.5 rotate-45 bg-molten lg:block"
                  />
                  <span className="font-mono text-[0.72rem] tracking-[0.24em] text-molten">
                    {step.n}
                  </span>
                  <h3 className="mt-4 font-display text-2xl font-semibold text-chrome">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-chrome-dim">
                    {step.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
