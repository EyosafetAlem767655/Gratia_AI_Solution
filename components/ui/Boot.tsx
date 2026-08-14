"use client";

/**
 * Holds the page behind a loading screen until it is genuinely ready, then
 * releases it and cascades the content in from the top.
 *
 * The progress bar reports real work, not a decorative timer: three weighted
 * signals — webfonts, the hero video's first decoded frame, and the projects
 * fetch — each move the bar when they actually land. A fake progress animation
 * that finishes before the page does is worse than no bar at all, because it
 * teaches people the bar means nothing.
 *
 * Two deliberate choices:
 *
 * - We wait for the video's `loadeddata` (first frame decoded), NOT
 *   `canplaythrough` (enough buffered to play to the end). The hero file is
 *   18MB; waiting for a full buffer would hold the page for many seconds on an
 *   ordinary connection, which is the opposite of the point.
 * - There is a hard ceiling. A loading gate without one is a permanently blank
 *   page the first time an asset stalls, so the page always appears — ready or
 *   not.
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

const CEILING_MS = 6000;

/** Relative weight of each signal. Video dominates because it is by far the
 *  largest thing being waited on, so the bar tracks felt progress. */
const WEIGHTS = { fonts: 0.2, video: 0.6, data: 0.2 } as const;
type Signal = keyof typeof WEIGHTS;

const ALL: Signal[] = ["fonts", "video", "data"];

type BootValue = {
  booted: boolean;
  reportVideoReady: () => void;
  reportDataReady: () => void;
};

const BootContext = createContext<BootValue>({
  booted: true,
  reportVideoReady: () => {},
  reportDataReady: () => {},
});

export function useBoot() {
  return useContext(BootContext);
}

export function BootProvider({
  children,
  expects = ALL,
}: {
  children: React.ReactNode;
  /**
   * Which signals this route actually produces. `/contact` has no hero video
   * and fetches no projects, so waiting on those would stall its loader until
   * the ceiling fired — a six-second blank screen on a page with nothing to
   * load. Routes declare what they will report; the weights renormalise.
   */
  expects?: Signal[];
}) {
  const [booted, setBooted] = useState(false);
  const [progress, setProgress] = useState(0);
  const done = useRef<Record<Signal, boolean>>({ fonts: false, video: false, data: false });
  const released = useRef(false);

  const release = useCallback(() => {
    if (released.current) return;
    released.current = true;
    setProgress(1);
    // Let the bar visibly reach 100% before the veil lifts. Snapping away at
    // 90% is the detail that makes a loader feel broken.
    window.setTimeout(() => setBooted(true), 260);
  }, []);

  // Renormalised so a route awaiting a subset still reaches a true 100%.
  const totalWeight = expects.reduce((sum, key) => sum + WEIGHTS[key], 0) || 1;
  const expectedKey = expects.join(",");

  const complete = useCallback(
    (signal: Signal) => {
      const watching = expectedKey.split(",") as Signal[];
      if (!watching.includes(signal) || done.current[signal]) return;
      done.current[signal] = true;
      const earned = watching.reduce(
        (sum, key) => sum + (done.current[key] ? WEIGHTS[key] : 0),
        0,
      );
      const ratio = earned / totalWeight;
      setProgress(ratio);
      if (ratio >= 0.999) release();
    },
    [release, totalWeight, expectedKey],
  );

  const reportVideoReady = useCallback(() => complete("video"), [complete]);
  const reportDataReady = useCallback(() => complete("data"), [complete]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.classList.add("no-motion");
      const immediate = window.setTimeout(release, 0);
      return () => window.clearTimeout(immediate);
    }

    const ceiling = window.setTimeout(release, CEILING_MS);
    document.fonts.ready.then(() => complete("fonts"));
    return () => window.clearTimeout(ceiling);
  }, [release, complete]);

  // Hold the scroll position while the veil is up, so nobody scrolls blind
  // through content they cannot see.
  useEffect(() => {
    if (booted) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [booted]);

  const value = useMemo(
    () => ({ booted, reportVideoReady, reportDataReady }),
    [booted, reportVideoReady, reportDataReady],
  );

  return (
    <BootContext.Provider value={value}>
      {children}
      <div data-boot-veil data-done={booted} aria-hidden={booted}>
        <div className="flex w-56 flex-col items-center gap-6">
          <LogoMark className="h-10 w-10 text-white" />
          <div
            className="h-px w-full overflow-hidden bg-white/15"
            role="progressbar"
            aria-label="Loading"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full origin-left bg-white transition-transform duration-500 ease-out"
              style={{ transform: `scaleX(${progress})` }}
            />
          </div>
          <span className="text-[0.65rem] tabular-nums tracking-[0.3em] text-white/70">
            {String(Math.round(progress * 100)).padStart(3, "0")}
          </span>
        </div>
      </div>
    </BootContext.Provider>
  );
}
