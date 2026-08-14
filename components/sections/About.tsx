"use client";

import { Reveal } from "@/components/ui/Reveal";
import { ABOUT } from "@/lib/content";

export function About() {
  return (
    <section id="about" className="relative px-5 py-24 sm:px-8 lg:px-12 lg:py-28">
      <div className="mx-auto w-full max-w-3xl">
        <Reveal>
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.25em] text-white/70">
            {ABOUT.eyebrow}
          </p>
        </Reveal>
        <Reveal>
          <h2 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
            {ABOUT.headline}
          </h2>
        </Reveal>
        {ABOUT.body.map((paragraph) => (
          <Reveal key={paragraph.slice(0, 24)}>
            <p className="mt-5 text-base leading-relaxed text-white/70">{paragraph}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
