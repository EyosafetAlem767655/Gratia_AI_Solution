"use client";

import { VideoField } from "@/components/VideoField";
import { Capabilities } from "@/components/sections/Capabilities";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { Work } from "@/components/sections/Work";
import { BootProvider } from "@/components/ui/Boot";
import SplashCursor from "@/components/ui/SplashCursor";
import { useProjects } from "@/hooks/useProjects";

export function HomePage() {
  const { projects, loading } = useProjects();

  return (
    // BootProvider holds the page behind a brand screen until fonts and the
    // film's first frames are ready, then reveals everything in one motion.
    // Every Reveal on the page animates from that single signal rather than
    // from its own scroll observer.
    <BootProvider>
      {/* The film, fixed at z-0 behind everything. */}
      <VideoField />

      {/* Fluid cursor at z-50; it mounts itself only on a fine pointer with
          motion allowed. The hero's nav sits above it. */}
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

      <main id="main" className="relative z-10">
        <Hero projects={projects} loading={loading} />
        <Capabilities />
        <Work projects={projects} loading={loading} />
        <Contact />
      </main>

      <Footer />
    </BootProvider>
  );
}
