"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import gsap from "gsap";
import type { PolymorphicTag } from "./polymorphic";

function prefersReduced() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Fades and lifts its children the first time they cross into view.
 *
 * The hidden start state lives in CSS (`[data-reveal]`), not in JS, so content
 * never flashes at full opacity before GSAP boots — and the `.no-motion` class
 * on <html> cancels the whole thing for reduced-motion visitors.
 */
export function Reveal({
  children,
  className,
  y = 34,
  delay = 0,
  duration = 1,
  variant = "lift",
  as: RawTag = "div",
}: {
  children: ReactNode;
  className?: string;
  y?: number;
  delay?: number;
  duration?: number;
  variant?: "fade" | "lift" | "depth" | "scale";
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);
  const Tag = RawTag as unknown as PolymorphicTag;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReduced()) {
      gsap.set(el, { opacity: 1, y: 0 });
      return;
    }

    const from = {
      fade: { opacity: 0 },
      lift: { opacity: 0, y },
      depth: { opacity: 0, y: y * 0.45, scale: 0.94, filter: "blur(10px)" },
      scale: { opacity: 0, scale: 0.9 },
    }[variant];
    gsap.set(el, { ...from, willChange: "transform, opacity" });

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          gsap.to(el, {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            duration,
            delay,
            ease: "power3.out",
            onComplete: () => gsap.set(el, { willChange: "auto" }),
          });
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [y, delay, duration, variant]);

  return (
    <Tag ref={ref} data-reveal className={className}>
      {children}
    </Tag>
  );
}

/** Staggers direct children into view as one authored transition. */
export function RevealGroup({
  children,
  className,
  stagger = 0.09,
  as: RawTag = "div",
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);
  const Tag = RawTag as unknown as PolymorphicTag;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = Array.from(el.children) as HTMLElement[];
    if (prefersReduced()) {
      gsap.set(items, { opacity: 1, y: 0 });
      return;
    }
    gsap.set(items, { opacity: 0, y: 28 });
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      gsap.to(items, { opacity: 1, y: 0, duration: 0.9, stagger, ease: "power3.out" });
      observer.disconnect();
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [stagger]);

  return <Tag ref={ref} className={className}>{children}</Tag>;
}

/**
 * Word-by-word masked reveal for headlines.
 *
 * Each word rides up from behind its own clipping box, which is what separates
 * a headline that feels authored from one that merely fades in.
 */
export function RevealText({
  text,
  className,
  delay = 0,
  stagger = 0.055,
  as: RawTag = "span",
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);
  const words = text.split(" ");
  const Tag = RawTag as unknown as PolymorphicTag;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const targets = el.querySelectorAll<HTMLElement>("[data-word]");
    if (targets.length === 0) return;

    gsap.set(el, { opacity: 1 });

    if (prefersReduced()) {
      gsap.set(targets, { yPercent: 0 });
      return;
    }

    gsap.set(targets, { yPercent: 118, willChange: "transform" });

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          gsap.to(targets, {
            yPercent: 0,
            duration: 1.05,
            delay,
            stagger,
            ease: "expo.out",
            // Release the compositor layer once the motion is over. Left on,
            // it holds stale paint through any later relayout.
            onComplete: () => gsap.set(targets, { willChange: "auto" }),
          });
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, stagger, text]);

  return (
    <Tag ref={ref} data-reveal className={className}>
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className="inline-block overflow-hidden align-bottom"
          // `overflow: hidden` clips at the padding box, so this padding is the
          // slack that keeps ascenders and descenders inside the mask at tight
          // display leading. The matching negative margins mean it costs no
          // layout — drop them and the line rhythm breaks.
          style={{
            paddingTop: "0.2em",
            marginTop: "-0.2em",
            paddingBottom: "0.28em",
            marginBottom: "-0.28em",
          }}
        >
          <span data-word className="inline-block">
            {word}
            {i < words.length - 1 ? " " : ""}
          </span>
        </span>
      ))}
    </Tag>
  );
}
