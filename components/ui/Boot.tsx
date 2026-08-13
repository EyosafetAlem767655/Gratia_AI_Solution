"use client";

/**
 * Holds the page behind a brand screen until it is genuinely ready, then
 * reveals all of it in one motion.
 *
 * The problem this solves: previously every animated element sat at opacity 0
 * behind its own IntersectionObserver, so the page assembled itself underneath
 * you as you scrolled — text arriving late, sections popping in. Gating on
 * scroll makes each individual entrance look considered and the page as a
 * whole feel unfinished.
 *
 * Now nothing is scroll-gated. We wait for the things that actually cause
 * visible reflow — webfonts and the video's first frames — and then release
 * everything together.
 *
 * The timeout is not optional. A boot gate with no ceiling is a permanently
 * blank page the first time an asset stalls, and the video here is 14MB. The
 * page always appears, ready or not.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { LogoMark } from "@/components/ui/Logo";

/** Longest the visitor will ever look at the brand screen. */
const CEILING_MS = 3000;

type BootValue = {
  booted: boolean;
  /** Called by whoever owns the video once it can paint. */
  reportVideoReady: () => void;
};

const BootContext = createContext<BootValue>({
  booted: true,
  reportVideoReady: () => {},
});

export function useBoot() {
  return useContext(BootContext);
}

export function BootProvider({ children }: { children: React.ReactNode }) {
  const [booted, setBooted] = useState(false);
  const videoReady = useRef(false);
  const fontsReady = useRef(false);

  const release = useCallback(() => {
    setBooted(true);
  }, []);

  const settle = useCallback(() => {
    if (videoReady.current && fontsReady.current) release();
  }, [release]);

  const reportVideoReady = useCallback(() => {
    videoReady.current = true;
    settle();
  }, [settle]);

  useEffect(() => {
    // Reduced motion skips the whole ceremony — someone who has asked for less
    // movement should not be shown a fade-in they did not want.
    //
    // Released on a zero timeout rather than called straight from the effect
    // body: a synchronous setState here would cascade an extra render pass
    // before paint, which the React Compiler flags for good reason. One tick
    // is imperceptible and keeps the render path clean.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.classList.add("no-motion");
      const immediate = window.setTimeout(release, 0);
      return () => window.clearTimeout(immediate);
    }

    const ceiling = window.setTimeout(release, CEILING_MS);

    document.fonts.ready.then(() => {
      fontsReady.current = true;
      settle();
    });

    return () => window.clearTimeout(ceiling);
  }, [release, settle]);

  // Lock scrolling while the veil is up, so a visitor cannot scroll blind
  // through content they cannot see yet.
  useEffect(() => {
    if (booted) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [booted]);

  const value = useMemo(() => ({ booted, reportVideoReady }), [booted, reportVideoReady]);

  return (
    <BootContext.Provider value={value}>
      {children}
      <div data-boot-veil data-done={booted} aria-hidden={booted}>
        <div className="flex flex-col items-center gap-5">
          <LogoMark className="h-10 w-10 animate-pulse text-white" />
          <span className="text-xs font-medium uppercase tracking-[0.3em] text-white/40">
            Gratia AI
          </span>
        </div>
      </div>
    </BootContext.Provider>
  );
}
