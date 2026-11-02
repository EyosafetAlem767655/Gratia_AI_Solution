"use client";

import { AlbertChat } from "@/components/albert/AlbertChat";
import { BootProvider } from "@/components/ui/Boot";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";
import { Nav } from "@/components/ui/Nav";
import SplashCursor from "@/components/ui/SplashCursor";
import { Reveal, useRevealCascade } from "@/components/ui/Reveal";
import { ALBERT } from "@/lib/content";

function Albert() {
  return (
    <section id="albert" className="relative scroll-mt-28 px-5 pb-16 pt-4 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-3xl">
        <Reveal>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-white/70">
            {ALBERT.eyebrow}
          </p>
        </Reveal>
        <Reveal>
          <h1 className="text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
            {ALBERT.headline}
          </h1>
        </Reveal>
        <Reveal>
          <p className="mb-8 mt-4 max-w-xl text-base leading-relaxed text-white/70">{ALBERT.body}</p>
        </Reveal>
        {/* Not wrapped in <Reveal>: its content changes after mount, and a
            reveal that has already played must not hide new questions. */}
        <AlbertChat />
      </div>
    </section>
  );
}

function Body() {
  useRevealCascade();
  return (
    <>
      <Nav />
      <main id="main" className="relative z-10 pt-24">
        <Albert />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

export function ContactPage() {
  return (
    // No <VideoField> here. The hero film plays on the landing page only, so
    // this route costs nothing to load and its text needs no scrim.
    <BootProvider expects={["fonts"]}>
      <SplashCursor
        DENSITY_DISSIPATION={3.5}
        VELOCITY_DISSIPATION={2}
        PRESSURE={0.1}
        CURL={3}
        SPLAT_RADIUS={0.2}
        SPLAT_FORCE={6000}
        COLOR_UPDATE_SPEED={10}
        SHADING
        RAINBOW_MODE={false}
        COLOR="#A855F7"
      />
      <Body />
    </BootProvider>
  );
}
