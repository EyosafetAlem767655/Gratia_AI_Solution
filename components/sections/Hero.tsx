"use client";

import { Reveal, RevealText } from "@/components/ui/Reveal";

export function Hero() {
  return (
    <section id="hero" className="beat">
      <div className="rails">
        <div>
          <Reveal>
            <p className="tag mb-6">Gratia AI</p>
          </Reveal>

          <h1 className="text-[clamp(2.75rem,7vw,5.5rem)]">
            <RevealText text="Make intelligence" className="block" />
            <RevealText text="come alive." className="block text-violet" delay={0.1} />
          </h1>

          <Reveal delay={0.25}>
            <p className="measure mt-7 text-lg text-muted">
              Production AI for real operations.
            </p>
          </Reveal>

          <Reveal delay={0.35}>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#contact" className="btn btn-violet">
                Start a project
              </a>
              <a href="#work" className="btn btn-ghost">
                See proof
              </a>
            </div>
          </Reveal>
        </div>

        {/* Right rail intentionally empty at the hero. The robot owns the
            frame here and nothing should compete with it. */}
        <div />
      </div>
    </section>
  );
}
