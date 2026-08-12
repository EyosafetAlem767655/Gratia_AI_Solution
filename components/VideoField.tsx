"use client";

/**
 * The film behind the page.
 *
 * A single fixed <video> plus two overlays. Scroll drives CSS custom
 * properties on <html>; CSS does the rest. Nothing here re-renders React and
 * nothing touches layout — only `transform` and `filter`, both of which the
 * compositor handles without repainting the video.
 *
 * Why grade and mask rather than scrubbing `currentTime`: the source clip is a
 * twelve-second, near-static push-in. Mapping scroll onto its timeline would
 * be the literal reading of "integrate with scroll" and would produce almost
 * no visible change, while making every frame depend on decode timing. Moving
 * the grade instead gives real motion and never stutters.
 */

import { useEffect, useRef, useState } from "react";

type Grade = {
  scale: number;
  brightness: number;
  saturate: number;
  blur: number;
  irisIn: number;
  irisOut: number;
};

/** Where each beat sits in page scroll, and what the film is doing there. */
const KEYS: readonly (Grade & { at: number })[] = [
  // hero — untouched. The shot sells itself.
  { at: 0.0, scale: 1.0, brightness: 1.0, saturate: 1.0, blur: 0, irisIn: 100, irisOut: 165 },
  // capabilities — iris closes onto the robot so four words can read
  { at: 0.3, scale: 1.04, brightness: 0.78, saturate: 1.05, blur: 0, irisIn: 26, irisOut: 74 },
  // proof — demoted to texture behind the only dense section
  { at: 0.58, scale: 1.12, brightness: 0.5, saturate: 0.55, blur: 4, irisIn: 60, irisOut: 130 },
  // contact — reopens, ends where it began
  { at: 1.0, scale: 1.02, brightness: 0.95, saturate: 1.0, blur: 0, irisIn: 100, irisOut: 170 },
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smootherstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
}

function sample(progress: number): Grade {
  let a = KEYS[0];
  let b = KEYS[KEYS.length - 1];
  for (let i = 0; i < KEYS.length - 1; i++) {
    if (progress >= KEYS[i].at && progress <= KEYS[i + 1].at) {
      a = KEYS[i];
      b = KEYS[i + 1];
      break;
    }
  }
  const t = smootherstep((progress - a.at) / Math.max(0.0001, b.at - a.at));
  return {
    scale: lerp(a.scale, b.scale, t),
    brightness: lerp(a.brightness, b.brightness, t),
    saturate: lerp(a.saturate, b.saturate, t),
    blur: lerp(a.blur, b.blur, t),
    irisIn: lerp(a.irisIn, b.irisIn, t),
    irisOut: lerp(a.irisOut, b.irisOut, t),
  };
}

export function VideoField() {
  const [reduced, setReduced] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [ready, setReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const small = window.matchMedia("(max-width: 820px)");
    const sync = () => {
      setReduced(motion.matches);
      setNarrow(small.matches);
      document.documentElement.classList.toggle("no-motion", motion.matches);
    };
    sync();
    motion.addEventListener("change", sync);
    small.addEventListener("change", sync);
    return () => {
      motion.removeEventListener("change", sync);
      small.removeEventListener("change", sync);
    };
  }, []);

  /**
   * Reveal the video once it can actually paint.
   *
   * This cannot be a plain `onCanPlay` prop. The file is small, often cached,
   * and served from the same origin, so it routinely reaches `canplay` before
   * React has finished hydrating and attached the listener — the event fires
   * once, is missed, and never fires again. The video then plays perfectly at
   * `opacity: 0` behind the poster forever, which is nearly invisible as a bug
   * because the poster is a frame of the same clip.
   *
   * So: check `readyState` first, and only subscribe if it has not got there.
   */
  useEffect(() => {
    if (reduced) return;
    const video = videoRef.current;
    if (!video) return;

    // HAVE_FUTURE_DATA — enough buffered to start showing frames.
    if (video.readyState >= 3) {
      setReady(true);
    } else {
      const onReady = () => setReady(true);
      video.addEventListener("canplay", onReady, { once: true });
      return () => video.removeEventListener("canplay", onReady);
    }
  }, [reduced, narrow]);

  // The `autoplay` attribute is not always honoured even when muted; nudge it
  // and swallow the rejection, since a paused first frame is still a valid
  // (if static) background.
  useEffect(() => {
    if (reduced) return;
    videoRef.current?.play().catch(() => {});
  }, [reduced, narrow]);

  useEffect(() => {
    if (reduced) return;
    let cancelled = false;
    let kill: (() => void) | undefined;

    import("gsap").then(async ({ gsap }) => {
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const root = document.documentElement;
      const apply = (progress: number) => {
        const v = sample(progress);
        root.style.setProperty("--v-scale", v.scale.toFixed(4));
        root.style.setProperty("--v-brightness", v.brightness.toFixed(4));
        root.style.setProperty("--v-saturate", v.saturate.toFixed(4));
        root.style.setProperty("--v-blur", `${v.blur.toFixed(2)}px`);
        root.style.setProperty("--iris-in", `${v.irisIn.toFixed(2)}%`);
        root.style.setProperty("--iris-out", `${v.irisOut.toFixed(2)}%`);
      };

      // No `trigger` property. With one, `start` and `end` resolve against
      // that element's box; without one they are absolute scroll positions and
      // `0 -> "max"` is exactly the whole page. Passing
      // document.documentElement here looks harmless and collapses the range,
      // pinning progress to 1 on the first scroll event — the film then freezes
      // on its last beat for the rest of the page.
      const trigger = ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => apply(self.progress),
      });

      apply(0);
      kill = () => trigger.kill();
    });

    return () => {
      cancelled = true;
      kill?.();
    };
  }, [reduced]);

  // Reduced motion: the poster, and nothing that moves. No video element is
  // created at all, so no decode work happens either.
  if (reduced) {
    return (
      <div className="fixed inset-0 z-0 bg-void" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/video/field-poster.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover [object-position:center_38%]"
        />
        <div className="field-sky" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0 bg-void" aria-hidden>
      <video
        // `key` forces a remount when the rendition changes, because swapping
        // a <source> alone does not make an already-loaded video reload.
        key={narrow ? "sm" : "lg"}
        ref={videoRef}
        className="field-video"
        src={narrow ? "/video/field-sm.mp4" : "/video/field.mp4"}
        poster="/video/field-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        style={{ opacity: ready ? 1 : 0, transition: "opacity 1.2s ease-out" }}
      />
      {/* Poster underneath, revealed until the first frame can paint. Keeps the
          hero from opening on a black rectangle on a slow connection. */}
      {!ready && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/video/field-poster.jpg"
          alt=""
          className="absolute inset-0 -z-10 h-full w-full object-cover [object-position:center_38%]"
        />
      )}
      <div className="field-iris" />
      <div className="field-sky" />
    </div>
  );
}
