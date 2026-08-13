"use client";

/**
 * The two glass cards in the hero.
 *
 * The design these follow shipped with invented social proof — a "42,500+"
 * figure, a testimonial from a "Sara Klein" at "Stratify", and a stock avatar.
 * None of that is here. A fabricated endorsement presented as genuine on a
 * real company's live site is not a placeholder, it is a false claim, and it
 * survives to production far too easily.
 *
 * Instead both cards read from the projects the Telegram bot publishes. When
 * that table is empty they fall back to statements that are true without
 * needing evidence — what the company does, not what someone said about it.
 */

import Image from "next/image";
import type { ProjectRecord } from "@/lib/types";

function Stat({ projects, loading }: { projects: ProjectRecord[]; loading: boolean }) {
  const count = projects.length;
  const hasWork = !loading && count > 0;

  return (
    <div className="glass flex flex-col justify-between rounded-2xl p-5 sm:w-64 sm:p-6">
      <p
        className="font-pixel text-3xl font-normal tracking-tight text-[#010101] sm:text-4xl lg:text-white"
        // Silkscreen is loaded for this one element. Everything else is Geist.
      >
        {hasWork ? `${count}` : "24/7"}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-[#010101]/70 sm:mt-4 lg:text-white/70">
        {hasWork
          ? `Production ${count === 1 ? "system" : "systems"} running inside real operations.`
          : "Systems that keep working after the launch, not demos that stop at one."}
      </p>
    </div>
  );
}

function Testimonial({ projects, loading }: { projects: ProjectRecord[]; loading: boolean }) {
  // Prefer an entry that actually carries a quote; a project row can exist
  // with an empty testimonial field.
  const featured = projects.find((p) => p.testimonial?.trim());

  if (loading || !featured) {
    return (
      <div className="glass flex flex-col rounded-2xl p-5 sm:w-64 sm:p-6">
        <p className="text-sm font-semibold text-[#010101] lg:text-white">
          What we build
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[#010101]/80 sm:mt-4 lg:text-white/80">
          Automation, prediction, computer vision and bespoke models — designed
          around your operation and handed over running.
        </p>
        <p className="mt-4 text-xs text-[#010101]/60 sm:mt-5 lg:text-white/60">
          Any industry, any scale
        </p>
      </div>
    );
  }

  return (
    <div className="glass flex flex-col rounded-2xl p-5 sm:w-64 sm:p-6">
      <div className="mb-3 flex items-center gap-2 sm:mb-4">
        {featured.companyLogoUrl ? (
          <Image
            src={featured.companyLogoUrl}
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 rounded-md bg-white/20 object-contain"
          />
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-black text-xs font-bold text-white">
            {featured.companyName.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="text-sm font-semibold text-[#010101] lg:text-white">
          {featured.companyName}
        </span>
      </div>

      <blockquote className="text-sm leading-relaxed text-[#010101]/80 lg:text-white/80">
        &ldquo;{featured.testimonial}&rdquo;
      </blockquote>

      {featured.industry && (
        <p className="mt-4 text-xs text-[#010101]/60 sm:mt-5 lg:text-white/60">
          {featured.industry}
        </p>
      )}
    </div>
  );
}

export function GlassCards({
  projects,
  loading,
}: {
  projects: ProjectRecord[];
  loading: boolean;
}) {
  return (
    <div className="flex w-full flex-col gap-4 sm:flex-row lg:w-auto lg:gap-5">
      <Stat projects={projects} loading={loading} />
      <Testimonial projects={projects} loading={loading} />
    </div>
  );
}
