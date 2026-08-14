"use client";

/**
 * Shared header for both routes.
 *
 * Lives here rather than inside the hero because `/contact` is a real page now
 * and needs the same chrome. In-page destinations stay hash links; Contact is
 * a `next/link`, so the address bar reads `/contact` and the URL survives a
 * refresh, a share and the back button.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const LINKS = [
  { label: "About", href: "/#about" },
  { label: "What we build", href: "/#services" },
  { label: "Industries", href: "/#industries" },
] as const;

export function Nav() {
  const [open, setOpen] = useState(false);
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

  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <nav className="flex items-center justify-between px-5 py-5 sm:px-8 sm:py-6 lg:px-12">
        <Link href="/" className="text-white transition-opacity hover:opacity-80">
          <Logo />
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          <div className="glass flex items-center gap-1 rounded-full px-1.5 py-1.5">
            {LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-full px-4 py-1.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </Link>
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
          className="glass relative z-50 flex h-10 w-10 items-center justify-center rounded-full text-white md:hidden"
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
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3.5 text-base font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              style={{
                opacity: open ? 1 : 0,
                transform: open ? "translateX(0)" : "translateX(24px)",
                transition: `opacity 400ms ease ${(i + 1) * 60}ms, transform 400ms ease ${(i + 1) * 60}ms`,
              }}
            >
              {link.label}
            </Link>
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
