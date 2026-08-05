"use client";

import { useActiveSection, useScrollProgress } from "@/hooks/useScrollProgress";

const STOPS = [
  { id: "hero", label: "Core" },
  { id: "capabilities", label: "Capabilities" },
  { id: "method", label: "Method" },
  { id: "work", label: "Work" },
  { id: "contact", label: "Contact" },
] as const;

const IDS = STOPS.map((s) => s.id);

/**
 * Instrument rail down the right edge: depth readout, a molten fill tracking
 * scroll, and a tick per section. Decorative and duplicative of the nav, so it
 * is hidden from assistive tech and from anything narrower than a laptop.
 */
export function ScrollRail() {
  const progress = useScrollProgress();
  const active = useActiveSection(IDS);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-5 lg:flex"
    >
      <span className="font-mono text-[0.65rem] tracking-[0.2em] text-[#5d6d80]">
        {String(Math.round(progress * 100)).padStart(3, "0")}
      </span>

      <div className="relative h-52 w-px bg-[#1a212c]">
        <div
          className="absolute inset-x-0 top-0 origin-top bg-gradient-to-b from-molten-hot to-molten"
          style={{ height: "100%", transform: `scaleY(${progress})` }}
        />

        {STOPS.map((stop, i) => {
          const at = i / (STOPS.length - 1);
          const isActive = active === stop.id;
          return (
            <span
              key={stop.id}
              className={`absolute -left-[3px] h-[7px] w-[7px] rounded-full border transition-all duration-500 ${
                isActive
                  ? "scale-125 border-molten bg-molten"
                  : "border-[#3d4959] bg-[#04060a]"
              }`}
              style={{ top: `calc(${at * 100}% - 3px)` }}
            />
          );
        })}
      </div>

      <span
        className="font-mono text-[0.6rem] uppercase tracking-[0.24em] text-[#5d6d80]"
        style={{ writingMode: "vertical-rl" }}
      >
        {STOPS.find((s) => s.id === active)?.label ?? "Core"}
      </span>
    </div>
  );
}
