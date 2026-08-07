"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * A firefly: a soft ring that trails the pointer and a bright point that
 * doesn't.
 *
 * The lag between the two is the whole trick — the point reads as the insect,
 * the ring as its glow catching up. It opens over anything marked
 * `data-cursor="link"` and disappears entirely on touch devices, where a fake
 * cursor is just a bug.
 */
export function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ringEl = ring.current;
    const dotEl = dot.current;
    if (!ringEl || !dotEl) return;

    if (
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    ringEl.style.opacity = "1";
    dotEl.style.opacity = "1";

    const ringX = gsap.quickTo(ringEl, "x", { duration: 0.5, ease: "power3" });
    const ringY = gsap.quickTo(ringEl, "y", { duration: 0.5, ease: "power3" });
    const dotX = gsap.quickTo(dotEl, "x", { duration: 0.08, ease: "power2" });
    const dotY = gsap.quickTo(dotEl, "y", { duration: 0.08, ease: "power2" });

    const onMove = (e: PointerEvent) => {
      ringX(e.clientX);
      ringY(e.clientY);
      dotX(e.clientX);
      dotY(e.clientY);
    };

    const setHover = (on: boolean) =>
      gsap.to(ringEl, {
        scale: on ? 2.1 : 1,
        borderColor: on ? "var(--lichen)" : "var(--moss-line)",
        duration: 0.35,
        ease: "power3.out",
      });

    const onOver = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('[data-cursor="link"], a, button')) setHover(true);
    };

    const onOut = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('[data-cursor="link"], a, button')) setHover(false);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      gsap.killTweensOf([ringEl, dotEl]);
    };
  }, []);

  return (
    <>
      <div
        ref={ring}
        aria-hidden
        // GSAP owns `transform` here, so the centring offset has to be margin.
        className="pointer-events-none fixed left-0 top-0 z-[70] h-8 w-8 rounded-full border opacity-0 mix-blend-difference"
        style={{
          borderColor: "var(--moss-line)",
          marginLeft: -16,
          marginTop: -16,
        }}
      />
      <div
        ref={dot}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[70] h-1 w-1 rounded-full bg-lichen opacity-0"
        style={{ marginLeft: -2, marginTop: -2 }}
      />
    </>
  );
}
