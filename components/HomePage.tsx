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
import { scrollToPath, scrollToSection, type SectionId } from "@/lib/scroll";
import { useEffect } from "react";

function Body({ section }: { section?: SectionId }) {
  const { booted, failed, reportDataReady, reportProgress, fail } = useBoot();
  const { projects, loading, error } = useProjects(failed);
  useRevealCascade();

  // The projects fetch is one of the three signals the progress bar tracks.
  useEffect(() => {
    if (error) fail(error);
    else if (!loading) reportDataReady();
  }, [loading, error, reportDataReady, fail]);

  useEffect(() => {
    if (loading || error || failed) return;
    let active = true;
    const urls = [...new Set([
      "/video/hero-poster.v2.jpg",
      "https://websitelaunches.com/badge/gratiaaisolutions.com.svg",
      ...projects.map(project => project.companyLogoUrl).filter(Boolean),
    ])];
    let decoded = 0;
    const images = urls.map(src => {
      const image = new Image();
      image.src = src;
      void image.decode().then(() => {
        if (active) reportProgress("images", ++decoded / urls.length);
      }).catch(() => { if (active) fail("A page image could not load. Please retry."); });
      return image;
    });
    return () => { active = false; images.forEach(image => { image.src = ""; }); };
  }, [loading, error, failed, projects, reportProgress, fail]);

  // Deep link: /about, /services and /industries render this same document, so
  // arriving at one means jumping to that section once the page is up.
  //
  // Instantly, not smoothly — animating a full page of scrolling on first paint
  // is disorienting, and the visitor never asked to travel, they asked to
  // arrive. The wait for `booted` matters twice over: the veil holds a scroll
  // lock, and the sections have no final height until the reveal cascade runs.
  useEffect(() => {
    if (!booted || !section) return;
    const frame = requestAnimationFrame(() => scrollToSection(section, "auto"));
    return () => cancelAnimationFrame(frame);
  }, [booted, section]);

  // Back and forward. `pushState` from a section link does not fire popstate,
  // so this only ever runs for real history navigation — no double scroll.
  useEffect(() => {
    const onPopState = () => scrollToPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

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

export function HomePage({ section }: { section?: SectionId }) {
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
      <Body section={section} />
    </BootProvider>
  );
}
