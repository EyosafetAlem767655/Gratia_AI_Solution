"use client";

/**
 * The landing screen: the film, and as little else as possible.
 *
 * LAYOUT IS DRIVEN BY THE FOOTAGE. The clip is a black sky across the top, a
 * humanoid robot occupying only x 47-55%, and a bright flower field across the
 * bottom. The copy used to sit bottom-left in a single 42rem block, directly on
 * the flowers, which is why a 94%-black scrim was needed to read it — the scrim
 * then hid the very thing the scrim was protecting.
 *
 * So at `lg` the copy splits into two flanks: headline left, subline and
 * actions right, with the middle third empty. The robot walks through the gap,
 * the flower field stays visible, and both text columns sit over sky and the
 * darker vignetted edges where contrast is nearly free. `<VideoField>` paints a
 * side scrim for those two columns and a much lighter bottom scrim than before.
 *
 * Below `lg` there is no room to flank anything, so it collapses to the old
 * bottom-anchored stack and leans on the bottom scrim as before.
 */

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLink } from "@/components/ui/SectionLink";
import { HERO } from "@/lib/content";

export function Hero() {
  return (
    <section id="hero" className="relative flex h-svh w-full flex-col">
      {/* `mt-auto` pins the stack to the bottom on small screens; at lg the
          grid takes over and centres the two flanks vertically instead. */}
      <div className="mt-auto px-5 pb-12 sm:px-8 sm:pb-14 lg:mt-0 lg:flex lg:flex-1 lg:items-center lg:px-12 lg:pb-0">
        <div className="w-full lg:grid lg:grid-cols-12 lg:items-center lg:gap-8">
          {/* LEFT FLANK — the headline. */}
          <div className="lg:col-span-5 xl:col-span-4">
            <Reveal>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-[3.25rem] xl:text-[3.5rem]">
                {HERO.headline}
              </h1>
            </Reveal>
          </div>

          {/* CENTRE — deliberately empty. This is the column the robot walks
              through; nothing may be placed here. */}
          <div className="hidden lg:col-span-2 lg:block xl:col-span-4" aria-hidden />

          {/* RIGHT FLANK — the supporting line and the actions, right-aligned
              so the two blocks read as a pair bracketing the figure. */}
          <div className="lg:col-span-5 xl:col-span-4 lg:text-right">
            <Reveal>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-white/75 lg:ml-auto lg:mt-0">
                {HERO.subline}
              </p>
            </Reveal>

            <Reveal>
              <div className="mt-6 flex flex-wrap items-center gap-3 lg:justify-end">
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
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
        <ChevronDown className="h-5 w-5 animate-bounce text-white/40" />
      </div>
    </section>
  );
}
