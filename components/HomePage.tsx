"use client";

import { VideoField } from "@/components/VideoField";
import { About } from "@/components/sections/About";
import { Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { Industries } from "@/components/sections/Industries";
import { Services } from "@/components/sections/Services";
import { Work } from "@/components/sections/Work";
import { BootProvider, useBoot } from "@/components/ui/Boot";
import { Nav } from "@/components/ui/Nav";
import { useRevealCascade } from "@/components/ui/Reveal";
import SplashCursor from "@/components/ui/SplashCursor";
import { useProjects } from "@/hooks/useProjects";
import { useEffect } from "react";

function Body() {
  const { projects, loading } = useProjects();
  const { reportDataReady } = useBoot();
  useRevealCascade();

  // The projects fetch is one of the three signals the progress bar tracks.
  useEffect(() => {
    if (!loading) reportDataReady();
  }, [loading, reportDataReady]);

  return (
    <>
      <VideoField />

      <Nav />

      <main id="main" className="relative z-10">
        <Hero />
        <About />
        <Services />
        <Industries />
        <Work projects={projects} loading={loading} />
      </main>

      <Footer />
    </>
  );
}

export function HomePage() {
  return (
    <BootProvider>
      {/* Fluid cursor. Mounts itself only on a fine pointer with motion
          allowed; deliberately untouched. */}
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
