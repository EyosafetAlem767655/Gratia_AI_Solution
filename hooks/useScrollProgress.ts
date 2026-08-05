"use client";

import { useEffect, useState } from "react";

/**
 * Page scroll as a 0 → 1 fraction, sampled on rAF and only committed when it
 * has actually moved. Used by the two chrome elements that genuinely need to
 * re-render (the rail readout and the nav state) — everything animated reads
 * `sceneState` instead and never touches React.
 */
export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    let last = -1;

    const read = () => {
      const max =
        document.documentElement.scrollHeight - window.innerHeight || 1;
      const next = Math.min(1, Math.max(0, window.scrollY / max));
      if (Math.abs(next - last) > 0.002) {
        last = next;
        setProgress(next);
      }
      raf = 0;
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return progress;
}

/**
 * Id of the section currently occupying the middle of the viewport.
 * Drives the nav indicator and the scroll rail.
 */
export function useActiveSection(ids: readonly string[]): string {
  const [active, setActive] = useState(ids[0] ?? "");

  useEffect(() => {
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry closest to the viewport middle rather than the first
        // intersecting one — sections here are taller than the viewport.
        const middle = window.innerHeight / 2;
        let best: { id: string; distance: number } | null = null;

        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const box = entry.boundingClientRect;
          const distance = Math.abs(box.top + box.height / 2 - middle);
          if (!best || distance < best.distance) {
            best = { id: entry.target.id, distance };
          }
        }

        if (best) setActive(best.id);
      },
      { rootMargin: "-35% 0px -35% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, [ids]);

  return active;
}
