"use client";

import { useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { TestimonialDialog } from "@/components/ui/TestimonialDialog";
import type { ProjectRecord } from "@/lib/types";

/**
 * Client testimonials, published from the Telegram bot, running as a train.
 *
 * THE TRACK. Cards are fixed-width and `shrink-0` inside a `w-max` flex row,
 * which is what stops them overlapping — the previous version animated a CSS
 * grid, so neighbours slid over each other. The set is rendered twice and the
 * animation runs -50% -> 0, which makes the loop seam invisible; see the
 * `.train` comment in globals.css. The second copy is `aria-hidden` so screen
 * readers hear each testimonial once.
 *
 * FULL BLEED. The heading stays inside the page column, but the track breaks
 * out to the viewport edge. A train that starts and stops at a 64rem gutter
 * reads as a stutter rather than as travel.
 *
 * LOGOS. Every logo is a 360x200 transparent PNG with the mark centred and
 * scaled to a constant optical area (see lib/images/logo.ts), so a single
 * `h-24` renders all of them at the same visual weight regardless of whether
 * the original was a tall crest or a long wordmark. The box is deliberately
 * generous: equalising by area necessarily makes a wide wordmark shorter than
 * a square crest, so the shared box has to be tall enough that the wide ones
 * are still comfortably readable.
 */
export function Work({
  projects,
  loading,
}: {
  projects: ProjectRecord[];
  loading: boolean;
}) {
  const [selected, setSelected] = useState<ProjectRecord | null>(null);

  // Roughly six seconds per card, so adding testimonials makes the loop longer
  // rather than making the train faster.
  const duration = Math.max(24, projects.length * 6);

  return (
    <section
      id="testimonials"
      className="section-y relative flex items-start overflow-hidden"
    >
      <div className="w-full">
        <div className="mx-auto w-full max-w-5xl px-5 sm:px-8 lg:px-12">
          <Reveal>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-white/70">
              Testimonials
            </p>
          </Reveal>
        </div>

        {loading ? (
          <div className="mx-auto flex w-full max-w-5xl gap-4 px-5 sm:px-8 lg:px-12">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-64 w-[300px] shrink-0 animate-pulse rounded-2xl bg-white/5"
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="mx-auto w-full max-w-5xl px-5 sm:px-8 lg:px-12">
            <Reveal>
              {/* An honest line rather than fabricated case studies. Projects
                  appear here automatically once published from the bot. */}
              <p className="max-w-md text-lg leading-relaxed text-white/60">
                First case studies landing soon.
              </p>
            </Reveal>
          </div>
        ) : (
          <Reveal variant="fade">
            <div className="train-viewport overflow-hidden">
              <div
                className="train flex w-max gap-4 px-4"
                data-paused={selected ? "true" : "false"}
                style={{ ["--train-duration" as string]: `${duration}s` }}
              >
                {/* Two passes: the visible set, then an identical copy that
                    exists only so the wrap has something to wrap into. */}
                {[0, 1].map((pass) =>
                  projects.map((project) => (
                    <button
                      key={`${pass}-${project.id}`}
                      type="button"
                      onClick={() => setSelected(project)}
                      aria-hidden={pass === 1}
                      tabIndex={pass === 1 ? -1 : undefined}
                      className="panel flex w-[300px] shrink-0 flex-col rounded-2xl p-5 text-left transition-colors duration-300 hover:bg-white/[0.14] sm:w-[340px]"
                    >
                      {project.companyLogoUrl && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={project.companyLogoUrl}
                          alt={`${project.companyName} logo`}
                          loading="eager"
                          decoding="async"
                          // The canvas is a fixed size for every logo, so a
                          // single height is all that is needed and they all
                          // come out balanced and centred.
                          className="mx-auto mb-4 h-24 w-auto object-contain"
                        />
                      )}

                      {project.testimonial && (
                        <blockquote className="line-clamp-4 text-sm leading-relaxed text-white/80">
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

                      <span className="mt-3 text-xs font-medium text-white/50">
                        Read the full story
                      </span>
                    </button>
                  )),
                )}
              </div>
            </div>
          </Reveal>
        )}
      </div>

      <TestimonialDialog project={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
