"use client";

import { Reveal } from "@/components/ui/Reveal";
import type { ProjectRecord } from "@/lib/types";

/**
 * Client testimonials, published from the Telegram bot.
 *
 * The logos are PNGs with their background already keyed out at upload time
 * (see lib/images/logo.ts), so they sit directly on the ink canvas with no
 * plate or panel behind them. Nothing here should reintroduce a light
 * background — that is the whole point of the extraction step.
 *
 * The gentle left-right drift is CSS only and transform-only, per the
 * performance rule in components/VideoField.tsx: a full-bleed video is
 * compositing behind this section, and anything that forces a re-raster during
 * scroll shows up immediately in the frame times.
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
      id="testimonials"
      className="relative flex items-start px-5 pb-16 pt-2 sm:px-8 lg:px-12"
    >
      <div className="mx-auto w-full max-w-5xl">
        <Reveal>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-white/70">
            Testimonials
          </p>
        </Reveal>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-52 animate-pulse rounded-2xl bg-white/5"
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
          /* The drift moves the cards a little way outside their column, so the
             overflow is clipped here rather than becoming a page-wide
             horizontal scrollbar. */
          <div className="overflow-hidden">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project, i) => (
                <Reveal key={project.id}>
                  <article
                    className="panel drift flex h-full flex-col rounded-2xl p-5 transition-colors duration-300 hover:bg-white/[0.14]"
                    /* Staggered so the row breathes instead of sliding as one
                       rigid block. */
                    style={{ animationDelay: `${(i % 3) * -2.6}s` }}
                  >
                    {project.companyLogoUrl && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={project.companyLogoUrl}
                        alt={`${project.companyName} logo`}
                        loading="lazy"
                        decoding="async"
                        /* Bounded on BOTH axes. Height alone makes a wide wordmark
                           enormous and a compact mark tiny; whichever limit
                           binds first keeps them at a similar visual weight. */
                        className="mb-4 h-auto max-h-12 w-auto max-w-[85%] object-contain object-left"
                      />
                    )}

                    {project.testimonial && (
                      <blockquote className="text-sm leading-relaxed text-white/80">
                        &ldquo;{project.testimonial}&rdquo;
                      </blockquote>
                    )}

                    <div className="mt-4 border-t border-white/10 pt-3">
                      <h3 className="text-sm font-semibold">
                        {project.companyName}
                      </h3>
                      {project.industry && (
                        <p className="mt-0.5 text-xs uppercase tracking-[0.2em] text-white/50">
                          {project.industry}
                        </p>
                      )}
                    </div>

                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-white/60">
                      {project.aiSummary ?? project.description}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
