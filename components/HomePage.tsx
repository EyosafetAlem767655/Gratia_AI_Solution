"use client";

import { Experience } from "@/components/canvas/Experience";
import { Capabilities } from "@/components/sections/Capabilities";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { Method } from "@/components/sections/Method";
import { Work } from "@/components/sections/Work";
import { Cursor } from "@/components/ui/Cursor";
import { Nav } from "@/components/ui/Nav";
import { Preloader } from "@/components/ui/Preloader";
import { ScrollRail } from "@/components/ui/ScrollRail";
import { useProjects } from "@/hooks/useProjects";

export function HomePage() {
  const { projects, loading } = useProjects();

  return (
    <>
      {/* Live WebGL forge, fixed behind everything at -z. */}
      <Experience projectCount={projects.length} />

      <Preloader />
      <Cursor />
      <Nav />
      <ScrollRail />

      <main id="main" className="relative z-10">
        <Hero />
        <Capabilities />
        <Method />
        <Work projects={projects} loading={loading} />
        <Contact />
      </main>

      <Footer />

      {/* Film stock over the whole page — grain first, scanlines under it. */}
      <div className="grain" aria-hidden />
      <div className="scanlines" aria-hidden />
    </>
  );
}
