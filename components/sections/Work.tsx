"use client";

import { Reveal, RevealText } from "@/components/ui/Reveal";
import { Spotlight } from "@/components/ui/Spotlight";
import type { ProjectRecord } from "@/lib/types";

export function Work({
  projects,
  loading,
}: {
  projects: ProjectRecord[];
  loading: boolean;
}) {
  return (
    <section id="work" className="relative px-[var(--gutter)] py-[var(--section-y)]">
      <div className="scrim scrim-dense" aria-hidden />

      <div className="relative z-10 mx-auto max-w-[80rem]">
        <header className="grid grid-cols-12 items-end gap-y-6">
          <div className="col-span-12 lg:col-span-8">
            <Reveal y={16}>
              <span className="tag">03 — Selected work</span>
            </Reveal>
            <RevealText
              as="h2"
              text="Systems in the wild."
              className="grow-type mt-5 block text-[clamp(2rem,4.6vw,3.8rem)] font-semibold"
            />
          </div>
          <Reveal delay={0.2} className="col-span-12 lg:col-span-4">
            <p className="text-sage lg:text-right">
              Real systems, built with a client, running against a concrete
              business problem.
            </p>
          </Reveal>
        </header>

        <div className="mt-16">
          {loading ? (
            <SkeletonGrid />
          ) : projects.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {projects.map((project, i) => (
                <Reveal key={project.id} delay={(i % 2) * 0.08} y={30}>
                  <ProjectCard project={project} index={i} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ProjectCard({
  project,
  index,
}: {
  project: ProjectRecord;
  index: number;
}) {
  const cover = project.generatedImageUrl;

  return (
    <Spotlight
      as="article"
      className="panel group h-full overflow-hidden rounded-[var(--leaf)] transition-colors duration-500 hover:border-[#2a5138]"
    >
      <div className="relative">
        {cover && (
          <div className="relative h-52 overflow-hidden">
            {/* Remote blob URLs, arbitrary dimensions — plain <img> is the
                honest choice here rather than fighting the image optimizer. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover opacity-70 grayscale transition-all duration-700 group-hover:scale-[1.04] group-hover:opacity-90 group-hover:grayscale-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a12] via-[#0a1a12]/30 to-transparent" />
          </div>
        )}

        <div className="p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={project.companyLogoUrl}
                alt=""
                loading="lazy"
                className="h-10 w-10 rounded border border-[#142a1c] bg-[#06120c] object-contain p-1.5"
              />
              <div>
                <h3 className="font-display text-lg font-semibold text-bone">
                  {project.companyName}
                </h3>
                {project.industry && (
                  <span className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-lichen">
                    {project.industry}
                  </span>
                )}
              </div>
            </div>
            <span className="tag text-[0.65rem]">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-sage">
            {project.aiSummary ?? project.description}
          </p>

          {project.testimonial && (
            <blockquote className="mt-6 border-l border-lichen/60 pl-4 text-sm italic leading-relaxed text-[#96b0a0]">
              &ldquo;{project.testimonial}&rdquo;
            </blockquote>
          )}
        </div>
      </div>
    </Spotlight>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2" aria-hidden>
      {[0, 1].map((i) => (
        <div
          key={i}
          className="panel h-72 animate-pulse rounded-[var(--leaf)]"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
      <p className="sr-only">Loading work</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="panel relative mx-auto max-w-2xl overflow-hidden rounded-[var(--leaf)] p-10 text-center">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(180,200,220,1)_1px,transparent_1px),linear-gradient(90deg,rgba(180,200,220,1)_1px,transparent_1px)] [background-size:28px_28px]"
      />
      <div className="relative">
        <span className="tag">Awaiting intake</span>
        <p className="mt-4 text-lg text-bone">
          Case studies are being commissioned.
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-sage">
          Client work is published straight from the studio&apos;s Telegram bot
          with{" "}
          <code className="rounded border border-[#142a1c] bg-[#030a07] px-1.5 py-0.5 font-mono text-[0.75rem] text-lichen">
            /addproject
          </code>
          .
        </p>
      </div>
    </div>
  );
}
