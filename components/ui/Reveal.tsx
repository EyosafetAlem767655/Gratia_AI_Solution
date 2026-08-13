"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import gsap from "gsap";
import { useBoot } from "./Boot";
import type { PolymorphicTag } from "./polymorphic";

/**
 * Fades and lifts its children once, when the page boots.
 *
 * This used to fire on an IntersectionObserver, one observer per element, so
 * content only materialised when you scrolled to it. Individually each
 * entrance looked fine; collectively the page assembled itself underneath the
 * visitor, which read as slow and unfinished. Now every reveal on the page
 * runs from the same boot signal and then stays put — scrolling moves you
 * through a page that is already fully drawn.
 *
 * The hidden start state lives in CSS (`[data-reveal]`) so nothing flashes at
 * full opacity before GSAP loads, and the reduced-motion rule in globals.css
 * overrides it to visible for anyone who has asked for less movement.
 */
export function Reveal({
  children,
  className,
  y = 24,
  delay = 0,
  duration = 0.8,
  variant = "lift",
  as: RawTag = "div",
}: {
  children: ReactNode;
  className?: string;
  y?: number;
  delay?: number;
  duration?: number;
  variant?: "fade" | "lift" | "scale";
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);
  const Tag = RawTag as unknown as PolymorphicTag;
  const { booted } = useBoot();

  useEffect(() => {
    const el = ref.current;
    if (!el || !booted) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(el, { opacity: 1, y: 0, scale: 1 });
      return;
    }

    const from = {
      fade: { opacity: 0 },
      lift: { opacity: 0, y },
      scale: { opacity: 0, scale: 0.96 },
    }[variant];

    const tween = gsap.fromTo(
      el,
      { ...from, willChange: "transform, opacity" },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration,
        delay,
        ease: "power3.out",
        // Release the compositor layer when the motion ends. Leaving the hint
        // on permanently keeps a layer alive that holds stale paint across any
        // later relayout — that is what once printed the headline twice.
        onComplete: () => gsap.set(el, { willChange: "auto" }),
      },
    );

    return () => {
      tween.kill();
    };
  }, [booted, y, delay, duration, variant]);

  return (
    <Tag ref={ref} data-reveal className={className}>
      {children}
    </Tag>
  );
}
