import type { ReactNode } from "react";

/**
 * Endless horizontal ticker. The children are rendered twice and the track is
 * translated by exactly -50%, which is what makes the loop seamless; the
 * duplicate is hidden from assistive tech so nothing is announced twice.
 */
export function Marquee({
  items,
  duration = 42,
  className = "",
}: {
  items: ReactNode[];
  duration?: number;
  className?: string;
}) {
  const row = (hidden: boolean) => (
    <div className="flex shrink-0 items-center" aria-hidden={hidden}>
      {items.map((item, i) => (
        <span key={i} className="flex items-center">
          <span className="px-6">{item}</span>
          <span
            className="h-1 w-1 rotate-45 bg-[#2a5138]"
            aria-hidden
          />
        </span>
      ))}
    </div>
  );

  return (
    <div
      className={`marquee relative overflow-hidden ${className}`}
      style={{ ["--marquee-duration" as string]: `${duration}s` }}
    >
      <div className="marquee-track">
        {row(false)}
        {row(true)}
      </div>

      {/* Feather both ends into the background. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-deep to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-deep to-transparent" />
    </div>
  );
}
