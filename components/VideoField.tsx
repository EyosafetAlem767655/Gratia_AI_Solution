"use client";

/**
 * The hero film.
 *
 * PERFORMANCE RULE — read before adding effects here.
 *
 * Only `opacity` and `translate3d` may ever be animated on this element. Both
 * were arrived at by measuring a scripted full-page scroll, not by intuition:
 *
 *   animated `filter` ................ worst; not a compositor property, so
 *                                      every frame re-rendered the surface
 *   animated `scale` ................. 66ms median, 88/90 frames dropped
 *   static scale + animated translate . 17ms median,  3/90 dropped
 *
 * `scale` is the subtle one. It *is* a transform, but changing it changes the
 * layer's rasterisation scale, which forces a re-raster every frame and
 * abandons Chrome's direct video-compositing path. `translate3d` moves an
 * already-rasterised layer for free.
 *
 * VISIBILITY: the video is paused whenever the hero is off screen. There is no
 * reason to decode 1080p frames nobody can see, and it is the behaviour that
 * was asked for.
 */

import { useEffect, useRef, useState } from "react";
import { useBoot } from "./ui/Boot";

const SMALL_BREAKPOINT = 820;

export function VideoField() {
  const video = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<"pending" | "video" | "still">("pending");
  const [src, setSrc] = useState<string | null>(null);
  const { reportVideoReady } = useBoot();

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setMode("still");
        reportVideoReady();
        return;
      }
      // Decided here rather than with a <source media> query: the browser
      // picks a <source> before layout, and getting it wrong sends 18MB to a
      // phone.
      setSrc(
        window.innerWidth < SMALL_BREAKPOINT ? "/video/hero-sm.mp4" : "/video/hero.mp4",
      );
      setMode("video");
    });
    return () => cancelAnimationFrame(id);
  }, [reportVideoReady]);

  // Release the loading gate on the first decoded frame. `readyState` is
  // checked first because for a cached file the event can fire before React
  // attaches the listener, and would then never fire again — holding the
  // loader until its timeout on every warm visit.
  useEffect(() => {
    const el = video.current;
    if (mode !== "video" || !el) return;

    if (el.readyState >= 2) {
      reportVideoReady();
      return;
    }
    const onReady = () => reportVideoReady();
    el.addEventListener("loadeddata", onReady, { once: true });
    // If the network dies entirely, still release rather than stranding the
    // visitor on the loading screen.
    el.addEventListener("error", onReady, { once: true });
    return () => {
      el.removeEventListener("loadeddata", onReady);
      el.removeEventListener("error", onReady);
    };
  }, [mode, reportVideoReady]);

  // Pause once the hero is out of view; resume when it returns.
  useEffect(() => {
    const el = video.current;
    if (mode !== "video" || !el) return;
    const hero = document.getElementById("hero");
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // play() rejects if the element is detached or autoplay is blocked;
          // neither is worth surfacing.
          void el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.05 },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, [mode]);

  // Scroll drives one number: how far past the hero we are. It dims the film
  // so the sections below read as text on near-solid dark.
  useEffect(() => {
    if (mode === "pending") return;

    let frame = 0;
    const apply = () => {
      frame = 0;
      const height = window.innerHeight || 1;
      const past = Math.min(1, Math.max(0, window.scrollY / height));
      document.documentElement.style.setProperty("--past-hero", past.toFixed(4));
    };
    const onScroll = () => {
      // Coalesce to one write per frame; scroll fires far more often than the
      // display refreshes.
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
          // The 1.04 scale is a constant, never animated — a slight overscan so
          // no edge shows. See the performance rule above.
          style={{ transform: "scale(1.04)", willChange: "transform" }}
          src={src}
          poster="/video/hero-poster.jpg"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        />
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src="/video/hero-poster.jpg" alt="" className="h-full w-full object-cover" />
      )}

      {/* Bottom scrim, always on.
          This clip is a black sky over a field of bright flowers, and the hero
          copy sits low — directly on the brightest part of the frame. Without
          this the text is unreadable. It fades to nothing by mid-frame so the
          robot and the sky stay clean. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] [background:linear-gradient(to_top,rgba(1,1,1,0.94)_0%,rgba(1,1,1,0.72)_28%,rgba(1,1,1,0.28)_62%,transparent_100%)]" />

      {/* Edge vignette — keeps the corners from competing with the nav. */}
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(125%_95%_at_50%_38%,transparent_45%,rgba(1,1,1,0.5)_100%)]" />

      {/* Dimmer for everything past the hero.
          Reaches FULL opacity, not 88%. Leaving a little of the film showing
          looked nice and measured badly: 12% of a bright flower field behind
          12px footer type came out at 1.26:1, far under the 4.5:1 floor. Below
          the hero the content sits on solid ink and every reading is safe.
          Opacity only — compositor-cheap, see the rule at the top. */}
      <div
        className="pointer-events-none absolute inset-0 bg-ink"
        style={{ opacity: "min(1, calc(var(--past-hero, 0) * 1.25))" }}
      />
    </div>
  );
}
