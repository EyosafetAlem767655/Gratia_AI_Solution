"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { LogoMark } from "./Logo";

// GSAP throttles its clock when frames take longer than half a second, which is
// exactly what happens behind a heavy WebGL scene on a weak GPU — the loader
// would then crawl and hold the page hostage. Real elapsed time is what we want.
gsap.ticker.lagSmoothing(0);

/**
 * Cold start. The mark breathes in the dark while a counter climbs, then the
 * panels peel back to reveal the grove behind them.
 *
 * It waits for `window.load` but never longer than a hard ceiling — a loader
 * that outstays the content it hides is worse than no loader at all. Visitors
 * who asked for reduced motion never see it.
 */
export function Preloader() {
  const [done, setDone] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reduced motion skips the sequence entirely. Dismissed on the next frame
    // rather than synchronously so this stays out of the render cascade — the
    // panels are the same colour as the page, so nothing visibly flashes.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = requestAnimationFrame(() => setDone(true));
      return () => cancelAnimationFrame(id);
    }

    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);

    const value = { n: 0 };
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;

      const tl = gsap.timeline({
        onComplete: () => {
          document.body.style.overflow = "";
          setDone(true);
        },
      });

      tl.to(value, {
        n: 100,
        duration: 0.4,
        ease: "power2.out",
        onUpdate: () => {
          if (counter.current) {
            counter.current.textContent = String(Math.round(value.n)).padStart(
              3,
              "0",
            );
          }
          if (bar.current) bar.current.style.transform = `scaleX(${value.n / 100})`;
        },
      })
        .to("[data-preload-fade]", {
          opacity: 0,
          y: -18,
          duration: 0.5,
          ease: "power3.in",
        })
        .to(
          "[data-preload-panel]",
          {
            scaleY: 0,
            duration: 0.9,
            ease: "expo.inOut",
            stagger: 0.06,
            transformOrigin: "top center",
          },
          "-=0.2",
        );
    };

    // Creep toward 90 while the page settles; `finish` covers the last stretch.
    const creep = gsap.to(value, {
      n: 90,
      duration: 2.4,
      ease: "power1.out",
      onUpdate: () => {
        if (counter.current) {
          counter.current.textContent = String(Math.round(value.n)).padStart(
            3,
            "0",
          );
        }
        if (bar.current) bar.current.style.transform = `scaleX(${value.n / 100})`;
      },
    });

    const onLoad = () => window.setTimeout(finish, 260);
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad);

    const ceiling = window.setTimeout(finish, 3200);
    // Last resort: whatever the animation is doing, the page is not staying
    // covered past this point.
    const failsafe = window.setTimeout(() => {
      document.body.style.overflow = "";
      setDone(true);
    }, 7000);

    return () => {
      window.removeEventListener("load", onLoad);
      window.clearTimeout(ceiling);
      window.clearTimeout(failsafe);
      creep.kill();
      document.body.style.overflow = "";
    };
  }, []);

  if (done) return null;

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      role="status"
      aria-label="Loading"
    >
      {/* Four panels that peel back independently. */}
      <div className="absolute inset-0 flex">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            data-preload-panel
            className="h-full flex-1 bg-deep"
            style={{ borderRight: i < 3 ? "1px solid #06120c" : undefined }}
          />
        ))}
      </div>

      <div
        data-preload-fade
        className="relative flex flex-col items-center gap-7"
      >
        <LogoMark className="h-16 w-16" />

        <div className="flex w-56 flex-col gap-3">
          <div className="h-px w-full overflow-hidden bg-[#142a1c]">
            <div
              ref={bar}
              className="h-full w-full origin-left bg-lichen"
              style={{ transform: "scaleX(0)" }}
            />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="tag">Germinating</span>
            <span
              ref={counter}
              className="grow-type font-mono text-sm tabular-nums"
            >
              000
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
