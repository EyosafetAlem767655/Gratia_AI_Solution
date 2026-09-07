"use client";

import { useEffect, useRef } from "react";
import { useBoot } from "./ui/Boot";

/** Account for the full object-cover surface, including portrait height and DPR.
 * Never upscale the source or change renditions mid-playback. */
export function selectHeroWidth(width: number, height: number, dpr: number) {
  const required = Math.min(1920, Math.max(width, height * 1928 / 1072) * Math.max(1, dpr) * 1.04);
  return [960, 1280, 1920].find(size => size >= required) ?? 1920;
}

export function VideoField() {
  const video = useRef<HTMLVideoElement>(null);
  const { prepared, booted, failed, reportProgress, reportVideoReady, fail, setStartAnimation } = useBoot();

  useEffect(() => {
    const el = video.current;
    if (!el || failed) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      reportVideoReady();
      return;
    }
    const controller = new AbortController();
    let objectUrl: string | undefined;
    const onError = () => fail("The animation could not load. Please retry.");
    const onReady = () => reportProgress("video", 0.99);
    el.addEventListener("loadeddata", onReady);
    el.addEventListener("error", onError);
    async function load() {
      const size = selectHeroWidth(innerWidth, innerHeight, devicePixelRatio);
      const response = await fetch(`/video/hero-${size}.v2.mp4`, { signal: controller.signal });
      if (!response.ok || !response.body) throw new Error("Video download failed");
      const length = Number(response.headers.get("content-length"));
      const reader = response.body.getReader();
      const chunks: ArrayBuffer[] = [];
      let received = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value.slice().buffer);
        received += value.byteLength;
        reportProgress("video", length > 0 ? Math.min(0.95, received / length * 0.95) : 0);
      }
      if (controller.signal.aborted) return;
      objectUrl = URL.createObjectURL(new Blob(chunks, { type: "video/mp4" }));
      el!.src = objectUrl;
      el!.load();
    }
    void load().catch(() => { if (!controller.signal.aborted) onError(); });
    return () => {
      controller.abort();
      el.removeEventListener("loadeddata", onReady);
      el.removeEventListener("error", onError);
      el.pause();
      el.removeAttribute("src");
      el.load();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [failed, reportProgress, reportVideoReady, fail]);

  // Only start once the entire page is prepared; play() confirms playback
  // before the veil lifts. A user gesture can unlock restrictive browsers.
  useEffect(() => {
    const el = video.current;
    if (!el || !prepared || failed || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let active = true;
    let startTimer: ReturnType<typeof setTimeout> | undefined;
    const start = () => {
      clearTimeout(startTimer);
      startTimer = setTimeout(() => { if (active) fail("The animation could not start. Please retry."); }, 30_000);
      void el.play().then(() => {
        clearTimeout(startTimer);
        if (!active) return;
        setStartAnimation(null);
        reportVideoReady();
      }).catch((error: DOMException) => {
        clearTimeout(startTimer);
        if (!active) return;
        if (error.name === "NotAllowedError") setStartAnimation(start);
        else fail("The animation could not start. Please retry.");
      });
    };
    start();
    return () => { active = false; clearTimeout(startTimer); setStartAnimation(null); };
  }, [prepared, failed, reportVideoReady, setStartAnimation, fail]);

  useEffect(() => {
    const el = video.current;
    const hero = document.getElementById("hero");
    if (!el || !hero || !booted || !el.currentSrc) return;
    let visible = true;
    const update = () => {
      if (visible && !document.hidden) void el.play().catch(() => {});
      else el.pause();
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }, { threshold: 0.05 });
    observer.observe(hero);
    document.addEventListener("visibilitychange", update);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, [booted]);

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
        // no edge shows. Keep effects to opacity and translation to avoid rerasterization.
        style={{ transform: "scale(1.04)", willChange: "transform" }}
        poster="/video/hero-poster.v2.jpg"
        loop
        muted
        playsInline
        preload="auto"
      >
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
