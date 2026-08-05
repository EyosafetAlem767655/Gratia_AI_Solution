"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";

/**
 * Pulls its child toward the cursor while the pointer is inside its box, then
 * springs back on exit.
 *
 * Applied to exactly two things per screen — the primary CTA and the nav
 * button. Any more and the page starts feeling loose rather than precise.
 */
export function Magnetic({
  children,
  className,
  strength = 0.32,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Fine pointers only: on touch there is no hover to track, and the
    // transform would fight the tap.
    if (
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const xTo = gsap.quickTo(el, "x", {
      duration: 0.5,
      ease: "elastic.out(1, 0.45)",
    });
    const yTo = gsap.quickTo(el, "y", {
      duration: 0.5,
      ease: "elastic.out(1, 0.45)",
    });

    const onMove = (e: PointerEvent) => {
      const box = el.getBoundingClientRect();
      xTo((e.clientX - box.left - box.width / 2) * strength);
      yTo((e.clientY - box.top - box.height / 2) * strength);
    };

    const onLeave = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      gsap.killTweensOf(el);
    };
  }, [strength]);

  return (
    // The caller's className wins outright: concatenating a hard-coded
    // `inline-flex` here would beat a `hidden` passed in from a call site.
    <span ref={ref} className={className ?? "inline-flex"}>
      {children}
    </span>
  );
}
