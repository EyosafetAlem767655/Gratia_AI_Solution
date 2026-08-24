"use client";

/**
 * Shared header for both routes.
 *
 * Lives here rather than inside the hero because `/contact` is a real page now
 * and needs the same chrome. Every destination is a real path — no hashes
 * anywhere — so each URL survives a refresh, a share and the back button.
 *
 * FIXED, not absolute. It used to scroll away with the page, which cost more
 * than the visual: below the fold on a phone the menu button went with it, so
 * there was no way to open navigation at all without scrolling back to the top.
 *
 * NO `backdrop-filter` ON THE BAR. A full-width blur over a playing video
 * re-blurs a large region every frame, and this project has already measured
 * what that costs (see the performance note in components/VideoField.tsx).
 * `bg-ink/85` reads as solid anyway, because the film is dimmed to full black
 * below the hero. The frosted `.glass` pill inside the bar is small and static,
 * which is a different proposition.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { SectionLink } from "@/components/ui/SectionLink";
import type { SectionPath } from "@/lib/scroll";

const LINKS: readonly { label: string; href: SectionPath }[] = [
  { label: "About", href: "/about" },
  { label: "What we build", href: "/services" },
  { label: "Industries", href: "/industries" },
  { label: "Testimonials", href: "/testimonials" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const [seenPath, setSeenPath] = useState(pathname);

  // Any navigation closes the drawer — including back/forward, which no click
  // handler sees. Without it the drawer stays open behind the new page with
  // the scroll lock still applied.
  //
  // Adjusted during render rather than in an effect: this is React's
  // documented pattern for resetting state when a prop changes, and it avoids
  // the extra commit-then-rerender an effect would cause.
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Transparent over the hero, opaque once the page has moved. Without this the
  // bar would sit unreadably on top of body copy.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        scrolled ? "border-b border-white/10 bg-ink/85" : "border-b border-transparent"
      }`}
    >
      <nav className="flex items-center justify-between px-5 py-4 sm:px-8 sm:py-5 lg:px-12">
        <Link href="/" className="text-white transition-opacity hover:opacity-80">
          <Logo />
        </Link>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="glass flex items-center gap-1 rounded-full px-1.5 py-1.5">
            {LINKS.map((link) => (
              <SectionLink
                key={link.label}
                href={link.href}
                className="rounded-full px-4 py-1.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </SectionLink>
            ))}
          </div>

          <Link
            href="/contact"
            className="btn-cta flex items-center self-stretch rounded-full px-5 text-sm font-medium"
          >
            Contact us
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="glass relative z-50 flex h-10 w-10 items-center justify-center rounded-full text-white lg:hidden"
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

      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-black/80 backdrop-blur-md transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden
      />
      <div
        className={`fixed right-0 top-0 z-40 flex h-full w-72 flex-col bg-black/90 backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col gap-2 px-6 pt-24">
          {LINKS.map((link, i) => (
            <SectionLink
              key={link.label}
              href={link.href}
              onNavigate={() => setOpen(false)}
              className="rounded-xl px-4 py-3.5 text-base font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <span
                style={{
                  display: "block",
                  opacity: open ? 1 : 0,
                  transform: open ? "translateX(0)" : "translateX(24px)",
                  transition: `opacity 400ms ease ${(i + 1) * 60}ms, transform 400ms ease ${(i + 1) * 60}ms`,
                }}
              >
                {link.label}
              </span>
            </SectionLink>
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
          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="btn-cta block w-full rounded-full py-3 text-center text-sm font-medium"
          >
            Contact us
          </Link>
        </div>
      </div>
    </header>
  );
}
