"use client";

/**
 * The film, fixed behind everything.
 *
 * PERFORMANCE NOTE — read before adding effects here.
 *
 * Two separate things made scrolling janky, and both were measured rather than
 * guessed. Isolating each element during a scripted full-page scroll:
 *
 *   video removed entirely ......... 17ms median,  0/90 frames dropped
 *   SplashCursor removed ........... 57ms median, 87/90 dropped
 *   backdrop-filter disabled ....... 60ms median, 89/90 dropped
 *   baseline ....................... 59ms median, 87/90 dropped
 *
 * So the glass and the fluid cursor were nearly free; the video was the whole
 * cost. Narrowing further:
 *
 *   animated `filter` on the video .. worst — not a compositor property, so
 *                                     every frame re-rendered the whole surface
 *   animated `scale` ................ 66ms median, 88/90 dropped
 *   static scale, animated translate  17ms median,  3/90 dropped
 *
 * The subtle one is `scale`. It *is* a transform, but changing it changes the
 * layer's rasterisation scale, which forces Chrome to re-rasterise the video
 * layer every frame and abandons its direct video-compositing fast path.
 * `translate3d` moves an already-rasterised layer and costs nothing.
 *
 * Hence the rules here:
 *   - scale is STATIC (a fixed overscan, so the edges never show),
 *   - only `translate3d` and `opacity` are ever animated,
 *   - no `filter` is animated, ever. A blur must be a static class toggle.
 */

import { useEffect, useRef, useState } from "react";
import { useBoot } from "./ui/Boot";

/** Below this width we serve the smaller rendition. */
const SMALL_BREAKPOINT = 820;

export function VideoField() {
  const video = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<"pending" | "video" | "still">("pending");
  const [src, setSrc] = useState<string | null>(null);
  const { reportVideoReady } = useBoot();

  useEffect(() => {
    // Deferred a frame rather than run in the effect body. Setting state
    // synchronously here cascades an extra render before paint; the boot veil
    // is covering the screen at this point, so a single frame costs nothing.
    const id = requestAnimationFrame(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setMode("still");
        reportVideoReady();
        return;
      }
      // Chosen once here rather than with a <source media> query: the browser
      // picks a <source> before layout, and getting it wrong means downloading
      // 14MB onto a phone.
      setSrc(
        window.innerWidth < SMALL_BREAKPOINT
          ? "/video/forest-sm.mp4"
          : "/video/forest.mp4",
      );
      setMode("video");
    });
    return () => cancelAnimationFrame(id);
  }, [reportVideoReady]);

  // Tell the boot gate when the first frames are decodable. Checking
  // readyState first matters: for a cached or fast-arriving file the event can
  // fire before React attaches the listener, and then it never fires again —
  // which would hold the veil up until the timeout every single time.
  useEffect(() => {
    const el = video.current;
    if (mode !== "video" || !el) return;

    if (el.readyState >= 3) {
      reportVideoReady();
      return;
    }
    const onReady = () => reportVideoReady();
    el.addEventListener("canplay", onReady, { once: true });
    // Belt and braces: if the network stalls entirely, `error` still releases
    // the gate rather than leaving the visitor staring at the brand screen.
    el.addEventListener("error", onReady, { once: true });
    return () => {
      el.removeEventListener("canplay", onReady);
      el.removeEventListener("error", onReady);
    };
  }, [mode, reportVideoReady]);

  // Scroll → CSS custom properties on <html>. Written outside React so scroll
  // never triggers a render; the compositor reads them from CSS.
  useEffect(() => {
    if (mode !== "video") return;

    let frame = 0;
    const apply = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      const root = document.documentElement.style;
      // A slow vertical drift, and a scrim that deepens as the content gets
      // denser then eases back for the closing section. The drift is a
      // percentage of the element's own height, which the static overscan
      // below leaves room for.
      root.setProperty("--v-shift", `${(-p * 5).toFixed(3)}%`);
      // Monotonic, not a bell curve. An earlier version used sin(pπ), which
      // peaked mid-page and fell back to nothing by the end — meaning Contact,
      // the most text-dense section on the site, got the *least* dimming and
      // its form sat unreadable over the bright centre of the frame. The film
      // should recede as the page gets denser and stay back.
      const eased = p * p * (3 - 2 * p);
      root.setProperty("--v-dim", (0.12 + eased * 0.62).toFixed(4));
    };

    const onScroll = () => {
      // Coalesce to one write per frame. Scroll fires far more often than the
      // display refreshes, and doing this work per event is pure waste.
      if (!frame) frame = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [mode]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-ink" aria-hidden>
      {mode === "video" && src ? (
        <video
          ref={video}
          className="h-full w-full object-cover"
          style={{
            // The 1.1 scale is a constant, never animated — it is the overscan
            // that gives the drift somewhere to travel without exposing an
            // edge. Only the translate changes.
            transform: "scale(1.1) translate3d(0, var(--v-shift, 0%), 0)",
            transformOrigin: "center 45%",
            // Promote to its own layer up front so the drift never triggers a
            // re-raster mid-scroll.
            willChange: "transform",
          }}
          src={src}
          poster="/video/forest-poster.jpg"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        />
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src="/video/forest-poster.jpg"
          alt=""
          className="h-full w-full object-cover"
        />
      )}

      {/* Dimming scrim. Opacity only — the cheap way to make the film recede. */}
      <div
        className="absolute inset-0 bg-ink"
        style={{ opacity: "var(--v-dim, 0.15)" }}
      />

      {/* Fixed vignette. Deepest at the bottom, where the copy sits, and at the
          edges — which is where this footage is already darkest, so it reads as
          the frame falling off rather than as an overlay. */}
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(120%_90%_at_50%_35%,transparent_35%,rgba(1,1,1,0.55)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 [background:linear-gradient(to_top,rgba(1,1,1,0.85),transparent)]" />
    </div>
  );
}
