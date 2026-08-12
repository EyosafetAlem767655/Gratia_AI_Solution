"use client";

import { Reveal, RevealGroup } from "@/components/ui/Reveal";

/**
 * Four words.
 *
 * The six entries in `SOLUTIONS` (lib/types.ts) are collapsed to four
 * groupings here on purpose: this beat is a list of capabilities, not a
 * catalogue, and six lines would push copy out of the sky band and onto the
 * flowers. The detail line is one short sentence, revealed on hover or focus
 * rather than always printed.
 */
const CAPABILITIES = [
  { word: "Automation", line: "Agents that remove repetitive work." },
  { word: "Prediction", line: "Forecasts and risk, early enough to act on." },
  { word: "Vision", line: "Inspection and monitoring that actually holds up." },
  { word: "Bespoke", line: "A new capability when nothing off-the-shelf fits." },
] as const;

export function Capabilities() {
  return (
    <section id="capabilities" className="beat">
      <div className="rails">
        <div>
          <Reveal>
            <p className="tag mb-8">What we build</p>
          </Reveal>

          <RevealGroup as="ul" className="space-y-1">
            {CAPABILITIES.map(({ word, line }) => (
              <li key={word} className="group">
                <button
                  type="button"
                  className="block w-full cursor-default text-left"
                  aria-describedby={`cap-${word}`}
                >
                  <span className="font-display text-[clamp(1.75rem,3.6vw,2.75rem)] font-semibold tracking-[-0.03em] text-white-soft transition-colors duration-300 group-hover:text-violet group-focus-within:text-violet">
                    {word}
                  </span>
                  {/* Collapsed to zero height until hover/focus, so the resting
                      state is four words and nothing else. */}
                  <span
                    id={`cap-${word}`}
                    className="grid grid-rows-[0fr] text-sm text-muted transition-[grid-template-rows] duration-400 ease-out group-hover:grid-rows-[1fr] group-focus-within:grid-rows-[1fr]"
                  >
                    <span className="overflow-hidden">
                      <span className="block pt-1">{line}</span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </RevealGroup>
        </div>

        <div />
      </div>
    </section>
  );
}
