"use client";

/**
 * The landing screen: the film, and as little else as possible.
 *
 * Content sits low, over the bottom scrim painted by <VideoField>. That scrim
 * is what makes white text legible here — the lower half of this clip is a
 * field of bright flowers. Do not remove one without the other.
 */

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLink } from "@/components/ui/SectionLink";
import { HERO } from "@/lib/content";

export function Hero() {
  return (
    <section id="hero" className="relative flex h-svh w-full flex-col">
      <div className="mt-auto px-5 pb-12 sm:px-8 sm:pb-14 lg:px-12 lg:pb-16">
        <div className="max-w-2xl">
          <Reveal>
            <h1 className="text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-[3.5rem]">
              {HERO.headline}
            </h1>
          </Reveal>

          <Reveal>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/75">
              {HERO.subline}
            </p>
          </Reveal>

          <Reveal>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/contact"
                className="btn-cta rounded-full px-6 py-3 text-sm font-medium"
              >
                {HERO.cta}
              </Link>
              <SectionLink
                href="/about"
                className="glass rounded-full px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/20"
              >
                What we do
              </SectionLink>
            </div>
          </Reveal>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
        <ChevronDown className="h-5 w-5 animate-bounce text-white/40" />
      </div>
    </section>
  );
}
