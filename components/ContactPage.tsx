"use client";

import { BootProvider } from "@/components/ui/Boot";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";
import { Nav } from "@/components/ui/Nav";
import SplashCursor from "@/components/ui/SplashCursor";
import { useRevealCascade } from "@/components/ui/Reveal";

function Body() {
  useRevealCascade();
  return (
    <>
      <Nav />
      <main id="main" className="relative z-10 pt-24">
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
