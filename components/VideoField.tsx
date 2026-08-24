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
 * DELIVERY — why the sources are markup and not state.
 *
 * The previous version chose a `src` in a client effect, inside a
 * `requestAnimationFrame`. That meant the request could not begin until React
 * had hydrated, so the largest asset on the page was also the last one
 * requested. Declaring `<source media>` children instead puts the URL in the
 * server-rendered HTML, where the browser's preload scanner finds it while it
 * is still parsing — the download starts before any JavaScript runs.
 *
 * The media queries do three jobs at once:
 *   - each viewport class gets a file sized for it, so a phone is never sent
 *     the desktop encode;
 *   - `prefers-reduced-motion: no-preference` means a reduced-motion visitor
 *     matches NO source, downloads nothing, and simply keeps the poster. That
 *     replaces the old `mode === "still"` state machine entirely;
 *   - selection happens during resource loading, so there is no flash of the
 *     wrong file.
 *
 * They are ordered narrowest-first because the algorithm takes the first match.
 *
 * VISIBILITY: the video is paused whenever the hero is off screen. There is no
 * reason to decode frames nobody can see.
 */

import { useEffect, useRef } from "react";
import { useBoot } from "./ui/Boot";

/** Must match the filenames produced by `scripts/fetch-assets.mjs`. Those names
 *  are a cache contract — see the note in that file before renaming. */
const SOURCES = [
  { src: "/video/hero-960.mp4", media: "(prefers-reduced-motion: no-preference) and (max-width: 819px)" },
  { src: "/video/hero-1280.mp4", media: "(prefers-reduced-motion: no-preference) and (max-width: 1439px)" },
  { src: "/video/hero-1920.mp4", media: "(prefers-reduced-motion: no-preference)" },
] as const;

export function VideoField() {
  const video = useRef<HTMLVideoElement>(null);
  const { reportVideoReady } = useBoot();

  // Release the loading gate on the first decoded frame. `readyState` is
  // checked first because for a cached file the event can fire before React
  // attaches the listener, and would then never fire again — holding the
  // loader until its timeout on every warm visit.
  useEffect(() => {
    const el = video.current;
    if (!el) return;

    // No source matched: reduced motion, or a browser that resolved nothing.
    // Nothing is downloading, so nothing is worth waiting for.
    if (!el.currentSrc) {
      reportVideoReady();
      return;
    }

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
  }, [reportVideoReady]);

  // Pause once the hero is out of view; resume when it returns.
  useEffect(() => {
    const el = video.current;
    if (!el) return;
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
  }, []);

  // Scroll drives one number: how far past the hero we are. It dims the film
  // so the sections below read as text on near-solid dark.
  useEffect(() => {
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
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-ink" aria-hidden>
      <video
        ref={video}
        className="h-full w-full object-cover"
        // The 1.04 scale is a constant, never animated — a slight overscan so
        // no edge shows. See the performance rule above.
        style={{ transform: "scale(1.04)", willChange: "transform" }}
        poster="/video/hero-poster.jpg"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      >
        {SOURCES.map((source) => (
          <source key={source.src} src={source.src} media={source.media} type="video/mp4" />
        ))}
      </video>

      {/* Bottom scrim, always on — but much lighter than it used to be.
          It was 70% tall and reached 0.94 black at the base, because the hero
          copy sat directly on the flower field and nothing less would carry it.
          The copy now flanks the frame at `lg`, so this only has to keep the
          brightest part of the field from fighting the chevron and the mobile
          stack. Shorter and weaker means the flowers are actually visible,
          which was the point of choosing this clip. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] [background:linear-gradient(to_top,rgba(1,1,1,0.88)_0%,rgba(1,1,1,0.6)_30%,rgba(1,1,1,0.2)_65%,transparent_100%)] lg:h-[46%] lg:[background:linear-gradient(to_top,rgba(1,1,1,0.72)_0%,rgba(1,1,1,0.42)_35%,transparent_100%)]" />

      {/* Side scrims for the two hero flanks, lg and up only.
          The headline sits left and the supporting copy right, over film rather
          than over the old heavy bottom scrim. These darken just those two
          columns and fade out well before the centre, so the robot — which
          occupies only x 47-55% — is never touched. Below lg the copy is a
          single bottom-anchored stack and these would darken the frame for
          nothing, so they do not render there. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[42%] lg:block [background:linear-gradient(to_right,rgba(1,1,1,0.8)_0%,rgba(1,1,1,0.45)_45%,transparent_100%)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] lg:block [background:linear-gradient(to_left,rgba(1,1,1,0.8)_0%,rgba(1,1,1,0.45)_45%,transparent_100%)]" />

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
