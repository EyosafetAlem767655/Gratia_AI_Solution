"use client";

import type { ProjectRecord } from "@/lib/types";
import { Reveal } from "@/components/ui/Reveal";

export function Projects({ projects, loading }: {
  projects: ProjectRecord[];
  loading: boolean;
}) {
  return (
    <section
      id="projects"
      className="relative min-h-screen px-6 py-24"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="text-center text-3xl font-bold text-[#F4EDE4] sm:text-5xl">
            Projects & Clients
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-[#A8C5A0]">
            A growing forest of partnerships — each project a unique blend of AI
            innovation and industry expertise.
          </p>
        </Reveal>

        {loading ? (
          <p className="mt-16 text-center text-[#A8C5A0]">Loading projects…</p>
        ) : projects.length === 0 ? (
          <div className="mx-auto mt-16 max-w-lg rounded-2xl border border-[#4A7C59]/30 bg-[#1B3A1A]/60 p-8 text-center backdrop-blur-md">
            <p className="text-[#F4EDE4]">
              No projects yet. Add your first client via the Telegram bot with{" "}
              <code className="rounded bg-[#2D4A2A] px-2 py-1 text-[#C9A961]">
                /addproject
              </code>
            </p>
          </div>
        ) : (
          <div className="mt-16 grid gap-8 md:grid-cols-2">
            {projects.map((project) => (
              <article
                key={project.id}
                className="overflow-hidden rounded-2xl border border-[#4A7C59]/30 bg-[#1B3A1A]/70 backdrop-blur-md"
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
                      <h3 className="font-semibold text-[#C9A961]">
                        {project.companyName}
                      </h3>
                      {project.industry && (
                        <span className="text-xs uppercase tracking-wider text-[#A8C5A0]">
                          {project.industry}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-[#F4EDE4]/90">
                    {project.aiSummary ?? project.description}
                  </p>
                  <blockquote className="mt-4 border-l-2 border-[#4A7C59] pl-4 text-sm italic text-[#A8C5A0]">
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
