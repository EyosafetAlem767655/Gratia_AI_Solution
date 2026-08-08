"use client";

import { useActiveSection, useScrollProgress } from "@/hooks/useScrollProgress";

const STOPS = [
  { id: "hero", label: "Awaken" },
  { id: "capabilities", label: "Connect" },
  { id: "method", label: "Build" },
  { id: "work", label: "Prove" },
  { id: "contact", label: "Evolve" },
] as const;

const IDS = STOPS.map((s) => s.id);

/**
 * Field rail down the right edge: a depth readout, sap rising with scroll, and
 * a tick per section. Decorative and duplicative of the nav, so it is hidden
 * from assistive tech and from anything narrower than a laptop.
 */
export function ScrollRail() {
  const progress = useScrollProgress();
  const active = useActiveSection(IDS);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-5 xl:flex"
    >
      <span className="font-mono text-[0.65rem] tracking-[0.2em] text-[#6b8574]">
        {String(Math.round(progress * 100)).padStart(3, "0")}
      </span>

      <div className="relative h-52 w-px bg-[#142a1c]">
        <div
          className="absolute inset-x-0 top-0 origin-top bg-gradient-to-b from-lichen to-jade"
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
                  ? "scale-125 border-lichen bg-lichen"
                  : "border-[#2a5138] bg-[#030a07]"
              }`}
              style={{ top: `calc(${at * 100}% - 3px)` }}
            />
          );
        })}
      </div>

      <span
        className="font-mono text-[0.6rem] uppercase tracking-[0.24em] text-[#6b8574]"
        style={{ writingMode: "vertical-rl" }}
      >
        {STOPS.find((s) => s.id === active)?.label ?? "Awaken"}
      </span>
    </div>
  );
}
