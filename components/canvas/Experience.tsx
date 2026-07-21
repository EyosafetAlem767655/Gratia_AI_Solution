"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";
import { ScrollContext } from "./scroll-context";
import type { ProjectRecord } from "@/lib/types";

const Canvas = dynamic(
  () => import("@react-three/fiber").then((mod) => mod.Canvas),
  { ssr: false },
);

const SceneContent = dynamic(
  () => import("./Scene").then((mod) => mod.SceneContent),
  { ssr: false },
);

export function Experience({ projects }: { projects: ProjectRecord[] }) {
  const [scroll, setScroll] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Intentional: initial preference must be read client-side after hydration
    // (matchMedia is unavailable during SSR), so a hydration mismatch is avoided.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReducedMotion(mq.matches);
    const onMq = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onMq);

    const onScroll = () => {
      const max =
        document.documentElement.scrollHeight - window.innerHeight || 1;
      setScroll(window.scrollY / max);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      mq.removeEventListener("change", onMq);
    };
  }, []);

  if (reducedMotion) {
    return (
      <div
        className="fixed inset-0 -z-10 bg-gradient-to-b from-[#12091F] via-[#1A0B2E] to-[#0B0413]"
        aria-hidden
      />
    );
  }

  return (
    <ScrollContext.Provider value={scroll}>
      <div className="fixed inset-0 -z-10">
        <Canvas
          camera={{ position: [0, 1.5, 7], fov: 50 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: false }}
        >
          <Suspense fallback={null}>
            <SceneContent projects={projects} scroll={scroll} />
          </Suspense>
        </Canvas>
      </div>
    </ScrollContext.Provider>
  );
}
