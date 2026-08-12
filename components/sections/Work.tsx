"use client";

import { Reveal } from "@/components/ui/Reveal";
import type { ProjectRecord } from "@/lib/types";

/**
 * The only beat allowed real density, which is exactly why the film is pushed
 * to scale 1.12 / blur 4px / saturate 0.55 behind it — see the `proof` key in
 * VideoField. Cards may drop below the sky band here; nothing else may.
 */
export function Work({ projects, loading }: { projects: ProjectRecord[]; loading: boolean }) {
  return (
    <section id="work" className="beat">
      <Reveal>
        <p className="tag mb-8">Proof</p>
      </Reveal>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-sm border border-indigo/60 bg-deep/40" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Reveal delay={0.1}>
          {/* An honest line rather than fabricated case studies. Projects are
              published from the Telegram bot and appear here automatically. */}
          <p className="measure text-lg text-muted">
            First case studies landing soon.
          </p>
        </Reveal>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Reveal key={project.id}>
              <article className="h-full rounded-sm border border-indigo/60 bg-deep/40 p-5 backdrop-blur-md transition-colors duration-300 hover:border-violet/50">
                <h3 className="text-lg font-semibold">{project.companyName}</h3>
                {project.industry && (
                  <p className="tag mt-1 text-violet">{project.industry}</p>
                )}
                <p className="mt-3 line-clamp-3 text-sm text-muted">
                  {project.aiSummary ?? project.description}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}
