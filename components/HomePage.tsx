"use client";

import Image from "next/image";
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

      <nav className="fixed top-0 z-50 w-full border-b border-[#334155]/50 bg-[#0F172A]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
          <a href="#hero" className="flex items-center gap-2.5">
            <Image
              src="/emblem.png"
              alt="Gratia AI Solutions"
              width={34}
              height={34}
              className="h-8 w-8 object-contain"
              priority
            />
            <span className="text-sm font-semibold tracking-wide text-[#F8FAFC]">
              GRATIA <span className="text-[#F59E0B]">AI</span>
            </span>
          </a>

          <div className="hidden items-center gap-8 text-sm text-[#CBD5E1] md:flex">
            <a href="#services" className="transition hover:text-white">
              Solutions
            </a>
            <a href="#projects" className="transition hover:text-white">
              Work
            </a>
            <a href="#contact" className="transition hover:text-white">
              Contact
            </a>
          </div>

          <a
            href="#contact"
            className="rounded-lg bg-[#F59E0B] px-4 py-2 text-sm font-semibold text-[#0F172A] transition hover:bg-[#FBBF24]"
          >
            Book a call
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
