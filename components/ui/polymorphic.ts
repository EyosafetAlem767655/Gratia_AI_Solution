import type { ComponentType, ReactNode, Ref } from "react";

/**
 * Props shape used by the handful of components in here that render whatever
 * tag the caller asks for.
 *
 * TypeScript resolves the props of a bare `ElementType` to the intersection of
 * every possible element, which collapses to `never` — so a polymorphic
 * component can't be typed by handing it the union directly. Asserting the tag
 * to this shape keeps every call site checked (children, className, ref, data-*
 * and handlers all still have to be present and spellable) without the
 * component itself becoming `any`.
 */
export type PolymorphicProps = {
  children?: ReactNode;
  className?: string;
  ref?: Ref<HTMLElement>;
  [key: string]: unknown;
};

export type PolymorphicTag = ComponentType<PolymorphicProps>;
