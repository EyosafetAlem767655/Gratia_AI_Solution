"use client";

import { useEffect, type ElementType, type ReactNode } from "react";
import gsap from "gsap";
import { useBoot } from "./Boot";
import type { PolymorphicTag } from "./polymorphic";

/**
 * Content entrance.
 *
 * `Reveal` itself renders nothing but a marked-up wrapper — the animation is
 * run centrally by `useRevealCascade`, once, when the page boots.
 *
 * That indirection is the point. The brief is "texts appear one by one from
 * top to bottom", and the only way to guarantee that ordering is to sort the
 * elements by their actual vertical position at run time. Per-component
 * `delay` props look equivalent and are not: the moment a section is
 * reordered, inserted or wrapped, the hand-numbered delays no longer match the
 * visual order and the cascade runs out of sequence with nothing obviously
 * wrong in the source.
 */
export function Reveal({
  children,
  className,
  variant = "lift",
  as: RawTag = "div",
}: {
  children: ReactNode;
  className?: string;
  variant?: "fade" | "lift";
  as?: ElementType;
}) {
  const Tag = RawTag as unknown as PolymorphicTag;
  return (
    <Tag data-reveal data-reveal-variant={variant} className={className}>
      {children}
    </Tag>
  );
}

/**
 * Runs the entrance for every `[data-reveal]` on the page, in document order,
 * top to bottom. Call once, high in the tree.
 */
export function useRevealCascade() {
  const { booted } = useBoot();

  useEffect(() => {
    if (!booted) return;

    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    if (nodes.length === 0) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(nodes, { opacity: 1, y: 0 });
      return;
    }

    // Sort by true vertical position, not DOM order. They usually agree, but
    // a two-column layout puts the right column later in the markup while it
    // sits alongside the left — sorting by geometry keeps the cascade reading
    // down the page rather than jumping back up to the top of column two.
    const sorted = nodes
      .map((el) => ({ el, top: el.getBoundingClientRect().top + window.scrollY }))
      .sort((a, b) => a.top - b.top);

    const tweens = sorted.map(({ el }, i) =>
      gsap.fromTo(
        el,
        {
          opacity: 0,
          y: el.dataset.revealVariant === "fade" ? 0 : 22,
          willChange: "transform, opacity",
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          // Capped so a long page does not take forever to finish arriving;
          // past the first dozen the remaining items are below the fold and
          // will have landed before anyone scrolls to them.
          delay: Math.min(i * 0.07, 1.4),
          ease: "power3.out",
          // Release the compositor layer when the motion ends. Left on, it
          // holds stale paint through any later relayout — that is what once
          // printed the headline twice.
          onComplete: () => gsap.set(el, { willChange: "auto" }),
        },
      ),
    );

    return () => {
      tweens.forEach((t) => t.kill());
    };
  }, [booted]);
}
