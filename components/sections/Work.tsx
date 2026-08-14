"use client";

import { Reveal } from "@/components/ui/Reveal";
import type { ProjectRecord } from "@/lib/types";

/**
 * Case studies, published from the Telegram bot.
 *
 * The only beat with real density, which is why the scrim in VideoField is at
 * its deepest here — the film steps back so cards can be read against it.
 */
export function Work({
  projects,
  loading,
}: {
  projects: ProjectRecord[];
  loading: boolean;
}) {
  return (
    <section
      id="work"
      className="relative flex items-start px-5 pb-28 pt-2 sm:px-8 lg:px-12"
    >
      <div className="mx-auto w-full max-w-5xl">
        <Reveal>
          <p className="mb-10 text-xs font-medium uppercase tracking-[0.25em] text-white/70">
            Proof
          </p>
        </Reveal>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-2xl bg-white/5"
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Reveal>
            {/* An honest line rather than fabricated case studies. Projects
                appear here automatically once published from the bot. */}
            <p className="max-w-md text-lg leading-relaxed text-white/60">
              First case studies landing soon.
            </p>
          </Reveal>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Reveal key={project.id}>
                <article className="glass h-full rounded-2xl p-5 transition-colors duration-300 hover:bg-white/[0.14]">
                  <h3 className="text-lg font-semibold">{project.companyName}</h3>
                  {project.industry && (
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/50">
                      {project.industry}
                    </p>
                  )}
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-white/70">
                    {project.aiSummary ?? project.description}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
