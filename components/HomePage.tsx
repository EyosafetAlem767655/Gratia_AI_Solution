"use client";

import { Experience } from "@/components/canvas/Experience";
import { Contact } from "@/components/sections/Contact";
import { Hero } from "@/components/sections/Hero";
import { Projects } from "@/components/sections/Projects";
import { Services } from "@/components/sections/Services";
import { useProjects } from "@/hooks/useProjects";

export function HomePage() {
  const { projects, loading } = useProjects();

  return (
    <>
      <Experience projects={projects} />
      <nav className="fixed top-0 z-50 flex w-full items-center justify-between px-6 py-4 backdrop-blur-md">
        <a href="#hero" className="text-sm font-semibold text-[#C9A961]">
          GRATIA AI
        </a>
        <div className="flex gap-6 text-sm text-[#F4EDE4]/80">
          <a href="#services" className="hover:text-[#C9A961]">
            Services
          </a>
          <a href="#projects" className="hover:text-[#C9A961]">
            Projects
          </a>
          <a href="#contact" className="hover:text-[#C9A961]">
            Contact
          </a>
        </div>
      </nav>
      <main className="relative z-10">
        <Hero />
        <Services />
        <Projects projects={projects} loading={loading} />
        <Contact />
      </main>
    </>
  );
}
