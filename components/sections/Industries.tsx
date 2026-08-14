"use client";

import { Reveal } from "@/components/ui/Reveal";
import { INDUSTRIES } from "@/lib/content";

export function Industries() {
  return (
    <section id="industries" className="relative px-5 py-24 sm:px-8 lg:px-12 lg:py-28">
      <div className="mx-auto w-full max-w-4xl">
        <Reveal>
          <p className="mb-10 text-xs font-medium uppercase tracking-[0.25em] text-white/70">
            Who we work with
          </p>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((industry) => (
            <Reveal key={industry.name}>
              <article className="glass h-full rounded-2xl p-5">
                <h3 className="text-base font-semibold">{industry.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  {industry.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
