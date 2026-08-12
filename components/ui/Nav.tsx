"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";

const LINKS = [
  { href: "#capabilities", label: "Build" },
  { href: "#work", label: "Proof" },
  { href: "#contact", label: "Begin" },
] as const;

/**
 * z-60 puts this above the splash cursor's canvas (z-50). The canvas is
 * pointer-events: none so it never blocked clicks, but the fluid would wash
 * over the wordmark and links if it painted on top.
 */
export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-60 transition-colors duration-500 ${
        scrolled ? "bg-void/60 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <nav className="flex items-center justify-between px-[var(--gutter)] py-5">
        <a href="#hero" aria-label="Gratia AI, home">
          <Logo />
        </a>

        <ul className="flex items-center gap-7 text-sm">
          {LINKS.map(({ href, label }) => (
            <li key={href}>
              <a className="link text-muted transition-colors hover:text-white-soft" href={href}>
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
