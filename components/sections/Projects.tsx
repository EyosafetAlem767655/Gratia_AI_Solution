"use client";

import type { ProjectRecord } from "@/lib/types";
import { Reveal } from "@/components/ui/Reveal";

export function Projects({
  projects,
  loading,
}: {
  projects: ProjectRecord[];
  loading: boolean;
}) {
  return (
    <section id="projects" className="relative px-6 py-28">
      <div className="section-scrim pointer-events-none absolute inset-0" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <Reveal>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-[#F59E0B]">
            Selected work
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl text-center text-3xl font-bold text-[#F8FAFC] sm:text-5xl">
            Products we&apos;ve shipped
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-[#94A3B8]">
            Real systems in production — each one built with a client to solve a
            concrete business problem.
          </p>
        </Reveal>

        {loading ? (
          <p className="mt-16 text-center text-[#94A3B8]">Loading work…</p>
        ) : projects.length === 0 ? (
          <div className="mx-auto mt-14 max-w-lg rounded-2xl border border-[#334155]/70 bg-[#182234]/60 p-8 text-center backdrop-blur-md">
            <p className="text-[#CBD5E1]">
              Case studies are being added. New client work is published from the
              Telegram bot with{" "}
              <code className="rounded bg-[#0F172A] px-2 py-1 text-[#FBBF24]">
                /addproject
              </code>
              .
            </p>
          </div>
        ) : (
          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {projects.map((project) => (
              <article
                key={project.id}
                className="group overflow-hidden rounded-2xl border border-[#334155]/70 bg-[#182234]/60 backdrop-blur-md transition hover:border-[#8B5CF6]/50"
              >
                {project.generatedImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={project.generatedImageUrl}
                    alt={`${project.companyName} visualization`}
                    className="h-48 w-full object-cover"
                  />
                )}
                <div className="p-6">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={project.companyLogoUrl}
                      alt={project.companyName}
                      className="h-10 w-10 rounded-lg bg-white/10 object-contain p-1"
                    />
                    <div>
                      <h3 className="font-semibold text-[#F8FAFC]">
                        {project.companyName}
                      </h3>
                      {project.industry && (
                        <span className="text-xs font-medium uppercase tracking-wider text-[#A78BFA]">
                          {project.industry}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-[#CBD5E1]">
                    {project.aiSummary ?? project.description}
                  </p>
                  <blockquote className="mt-4 border-l-2 border-[#F59E0B] pl-4 text-sm italic text-[#94A3B8]">
                    &ldquo;{project.testimonial}&rdquo;
                  </blockquote>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
