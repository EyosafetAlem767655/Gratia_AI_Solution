"use client";

/**
 * The hero: one full viewport over the forest film.
 *
 * The colour flips that run through this file — `text-[#010101] lg:text-white`
 * — are not decoration. `object-cover` crops the video differently per
 * viewport: on a narrow screen you get the bright hazy centre of the frame
 * behind the copy, on a wide one you get the dark trunks and forest floor.
 * Near-black type on small, white on large, is what keeps it readable in both.
 */

import { useEffect, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Reveal } from "@/components/ui/Reveal";
import { GlassCards } from "@/components/sections/GlassCards";
import type { ProjectRecord } from "@/lib/types";

const LINKS = [
  { label: "Capabilities", href: "#capabilities" },
  { label: "Work", href: "#work" },
  { label: "Approach", href: "#capabilities", chevron: true },
  { label: "Contact", href: "#contact" },
];

export function Hero({
  projects,
  loading,
}: {
  projects: ProjectRecord[];
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);

  // Lock the page while the drawer is open, and always restore on unmount —
  // leaving `overflow: hidden` behind is the classic drawer bug.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Escape closes it. Cheap to add, and its absence is always noticed.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <section id="top" className="relative h-svh w-full overflow-hidden">
      <div className="relative z-10 flex h-full flex-col">
        {/* ---------------------------------------------------------------- */}
        <nav className="flex items-center justify-between px-5 py-5 sm:px-8 sm:py-6 lg:px-12">
          <a
            href="#top"
            className="text-[#010101] transition-opacity hover:opacity-80 lg:text-white"
          >
            <Logo />
          </a>

          <div className="hidden items-center gap-3 md:flex">
            <div className="glass flex items-center gap-1 rounded-full px-1.5 py-1.5">
              {LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {link.label}
                  {link.chevron && <ChevronDown className="h-3.5 w-3.5" />}
                </a>
              ))}
            </div>

            <a
              href="#contact"
              className="btn-cta flex items-center self-stretch rounded-full px-5 text-sm font-medium"
            >
              Start a project
            </a>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="glass relative z-50 flex h-10 w-10 items-center justify-center rounded-full text-[#010101] md:hidden lg:text-white"
          >
            <Menu
              className={`absolute h-5 w-5 transition-all duration-300 ${
                open ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
              }`}
            />
            <X
              className={`absolute h-5 w-5 transition-all duration-300 ${
                open ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
              }`}
            />
          </button>
        </nav>

        {/* ---- mobile drawer ---------------------------------------------- */}
        <div
          onClick={() => setOpen(false)}
          className={`fixed inset-0 z-40 bg-black/80 backdrop-blur-md transition-opacity duration-300 md:hidden ${
            open ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          aria-hidden
        />
        <div
          className={`fixed right-0 top-0 z-40 flex h-full w-72 flex-col bg-black/90 backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex flex-col gap-2 px-6 pt-24">
            {LINKS.map((link, i) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                style={{
                  opacity: open ? 1 : 0,
                  transform: open ? "translateX(0)" : "translateX(24px)",
                  transition: `opacity 400ms ease ${(i + 1) * 60}ms, transform 400ms ease ${(i + 1) * 60}ms`,
                }}
              >
                {link.label}
                {link.chevron && <ChevronDown className="h-4 w-4" />}
              </a>
            ))}
          </div>

          <div
            className="mt-auto px-6 pb-10"
            style={{
              opacity: open ? 1 : 0,
              transform: open ? "translateY(0)" : "translateY(16px)",
              transition: "opacity 400ms ease 300ms, transform 400ms ease 300ms",
            }}
          >
            <a
              href="#contact"
              onClick={() => setOpen(false)}
              className="btn-cta block w-full rounded-full py-3 text-center text-sm font-medium"
            >
              Start a project
            </a>
          </div>
        </div>

        {/* ---- bottom-anchored content ------------------------------------ */}
        <div className="mt-auto flex flex-col gap-6 px-5 pb-8 sm:gap-8 sm:px-8 sm:pb-12 lg:flex-row lg:items-end lg:justify-between lg:px-12 lg:pb-16">
          <div className="max-w-xl">
            <Reveal>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-tight text-[#010101] sm:text-4xl lg:text-[3.5rem] lg:text-white">
                Ship AI systems that work while you sleep
              </h1>
            </Reveal>

            <Reveal delay={0.1}>
              <form
                action="#contact"
                className="mt-6 flex flex-col gap-3 sm:mt-8 sm:inline-flex sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:bg-white sm:p-1.5"
              >
                <label htmlFor="hero-email" className="sr-only">
                  Your email
                </label>
                <input
                  id="hero-email"
                  type="email"
                  name="email"
                  placeholder="Type your email"
                  className="rounded-full bg-white px-5 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none sm:w-64 sm:rounded-none sm:bg-transparent sm:px-4 sm:py-2"
                />
                <button
                  type="submit"
                  className="btn-cta rounded-full px-6 py-3 text-sm font-medium sm:py-2.5"
                >
                  Get started
                </button>
              </form>
            </Reveal>
          </div>

          <Reveal delay={0.2} className="lg:w-auto">
            <GlassCards projects={projects} loading={loading} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
