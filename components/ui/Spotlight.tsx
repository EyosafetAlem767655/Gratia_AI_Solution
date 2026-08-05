"use client";

import {
  useCallback,
  type ElementType,
  type PointerEvent,
  type ReactNode,
} from "react";
import type { PolymorphicTag } from "./polymorphic";

/**
 * Writes the pointer's position into `--mx` / `--my` on the element itself.
 *
 * The glow is drawn entirely by the `.spotlight` rules in globals.css, so the
 * only work JavaScript does per move is two style writes — no state, no
 * re-render, no layout read beyond the one bounding box.
 */
export function Spotlight({
  children,
  className = "",
  as: RawTag = "div",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  [key: string]: unknown;
}) {
  const Tag = RawTag as unknown as PolymorphicTag;

  const onPointerMove = useCallback((e: PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const box = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - box.left}px`);
    el.style.setProperty("--my", `${e.clientY - box.top}px`);
  }, []);

  return (
    <Tag
      className={`spotlight ${className}`}
      onPointerMove={onPointerMove}
      {...rest}
    >
      <span className="spotlight-wash" aria-hidden />
      {children}
    </Tag>
  );
}
