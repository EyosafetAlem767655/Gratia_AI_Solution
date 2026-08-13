"use client";

import { Reveal } from "@/components/ui/Reveal";

/**
 * Four words.
 *
 * The six entries in `SOLUTIONS` (lib/types.ts) are collapsed to four
 * groupings here on purpose: this beat is a list of capabilities, not a
 * catalogue. The detail line is one short sentence — enough to be concrete,
 * short enough that the film still carries the screen.
 */
const CAPABILITIES = [
  { word: "Automation", line: "Agents that remove repetitive work." },
  { word: "Prediction", line: "Forecasts and risk, early enough to act on." },
  { word: "Vision", line: "Inspection and monitoring that holds up in the field." },
  { word: "Bespoke", line: "A new capability when nothing off-the-shelf fits." },
] as const;

export function Capabilities() {
  return (
    <section
      id="capabilities"
      className="relative flex min-h-[78svh] items-center px-5 pb-6 pt-24 sm:px-8 lg:px-12"
    >
      <div className="mx-auto w-full max-w-5xl">
        <Reveal>
          <p className="mb-10 text-xs font-medium uppercase tracking-[0.25em] text-white/50">
            What we build
          </p>
        </Reveal>

        <ul className="space-y-6 sm:space-y-8">
          {CAPABILITIES.map((item, i) => (
            <Reveal as="li" key={item.word} delay={0.06 * i}>
              <div className="group flex flex-col gap-1 border-b border-white/10 pb-6 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
                <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                  {item.word}
                </h3>
                <p className="max-w-xs text-sm leading-relaxed text-white/60 transition-colors group-hover:text-white/90">
                  {item.line}
                </p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
