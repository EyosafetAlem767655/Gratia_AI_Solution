"use client";

import { useEffect, useState } from "react";
import { useActiveSection, useScrollProgress } from "@/hooks/useScrollProgress";
import { Logo } from "./Logo";
import { Magnetic } from "./Magnetic";

const LINKS = [
  { id: "capabilities", label: "Capabilities" },
  { id: "method", label: "Method" },
  { id: "work", label: "Work" },
  { id: "contact", label: "Contact" },
] as const;

const SECTION_IDS = ["hero", ...LINKS.map((l) => l.id)] as const;

export function Nav() {
  const progress = useScrollProgress();
  const active = useActiveSection(SECTION_IDS);
  const [open, setOpen] = useState(false);
  const lifted = progress > 0.01;

  // A drawer that survives a resize into desktop layout is a trap.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const mq = window.matchMedia("(min-width: 768px)");
    const onWide = () => mq.matches && setOpen(false);

    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onWide);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onWide);
    };
  }, [open]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded focus:bg-lichen focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#05160c]"
      >
        Skip to content
      </a>

      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          lifted
            ? "border-b border-[#122318] bg-[#030a07]/72 backdrop-blur-xl"
            : "border-b border-transparent"
        }`}
      >
        <nav
          aria-label="Primary"
          className="mx-auto flex max-w-[80rem] items-center justify-between gap-6 px-[var(--gutter)] py-4"
        >
          <a
            href="#hero"
            className="group"
            aria-label="Gratia AI Solutions — home"
          >
            <Logo className="transition-opacity duration-300 group-hover:opacity-85" />
          </a>

          <ul className="hidden items-center gap-1 md:flex">
            {LINKS.map((link) => {
              const isActive = active === link.id;
              return (
                <li key={link.id}>
                  <a
                    href={`#${link.id}`}
                    aria-current={isActive ? "true" : undefined}
                    className={`relative rounded px-3.5 py-2 text-sm transition-colors duration-300 ${
                      isActive
                        ? "text-bone"
                        : "text-sage hover:text-bone"
                    }`}
                  >
                    {link.label}
                    <span
                      aria-hidden
                      className={`absolute inset-x-3.5 -bottom-0.5 h-px origin-left bg-lichen transition-transform duration-500 ${
                        isActive ? "scale-x-100" : "scale-x-0"
                      }`}
                    />
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-3">
            <Magnetic className="hidden sm:inline-flex">
              <a href="#contact" className="btn btn-lichen !px-5 !py-2.5">
                Start a project
              </a>
            </Magnetic>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="flex h-11 w-11 items-center justify-center rounded border border-[#1c3626] text-bone md:hidden"
            >
              <span className="relative block h-3 w-4">
                <span
                  className={`absolute left-0 block h-px w-4 bg-current transition-all duration-300 ${
                    open ? "top-1.5 rotate-45" : "top-0"
                  }`}
                />
                <span
                  className={`absolute left-0 block h-px w-4 bg-current transition-all duration-300 ${
                    open ? "top-1.5 -rotate-45" : "top-3"
                  }`}
                />
              </span>
            </button>
          </div>
        </nav>

        {/* Scroll progress vine welded to the bottom of the bar. */}
        <div
          aria-hidden
          className="h-px origin-left bg-gradient-to-r from-lichen to-jade"
          style={{ transform: `scaleX(${progress})` }}
        />
      </header>

      {/* Mobile drawer */}
      <div
        id="mobile-menu"
        className={`fixed inset-0 z-40 flex flex-col justify-center bg-[#030a07]/97 px-[var(--gutter)] backdrop-blur-2xl transition-all duration-500 md:hidden ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <ul className="space-y-2">
          {LINKS.map((link, i) => (
            <li key={link.id}>
              <a
                href={`#${link.id}`}
                onClick={() => setOpen(false)}
                className="flex items-baseline gap-5 border-b border-[#122318] py-5"
                style={{
                  transform: open ? "translateY(0)" : "translateY(18px)",
                  opacity: open ? 1 : 0,
                  transition: `all 0.5s var(--ease-out) ${i * 0.06 + 0.1}s`,
                }}
              >
                <span className="tag">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-display text-3xl text-bone">
                  {link.label}
                </span>
              </a>
            </li>
          ))}
        </ul>
        <a
          href="#contact"
          onClick={() => setOpen(false)}
          className="btn btn-lichen mt-10 w-full"
        >
          Start a project
        </a>
      </div>
    </>
  );
}
