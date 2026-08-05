"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";
import { sceneState } from "./scene-state";

const Canvas = dynamic(
  () => import("@react-three/fiber").then((m) => m.Canvas),
  { ssr: false },
);

const SceneContent = dynamic(
  () => import("./Scene").then((m) => m.SceneContent),
  { ssr: false },
);

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl")),
    );
  } catch {
    return false;
  }
}

/**
 * Static stand-in for the live scene. Shown when the visitor asks for reduced
 * motion or the device has no WebGL — same palette, same composition, none of
 * the movement.
 */
function StillFrame() {
  return (
    <div className="fixed inset-0 z-0 bg-void" aria-hidden>
      <div className="absolute inset-0 [background:radial-gradient(60%_45%_at_50%_38%,rgba(255,157,46,0.14),transparent_70%)]" />
      <div className="absolute inset-0 [background:radial-gradient(80%_50%_at_50%_120%,rgba(120,150,180,0.1),transparent_65%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 opacity-[0.14] [background-image:linear-gradient(rgba(160,180,200,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(160,180,200,0.6)_1px,transparent_1px)] [background-size:60px_60px] [mask-image:linear-gradient(to_top,black,transparent)]" />
    </div>
  );
}

/**
 * Owns the WebGL surface and the plumbing that feeds it.
 *
 * Scroll and pointer are written straight into the module-level `sceneState`
 * rather than React state: at 60fps a `setState` per event would re-render the
 * entire page for values only the render loop reads.
 */
export function Experience({ projectCount }: { projectCount: number }) {
  const [mode, setMode] = useState<"pending" | "live" | "still">("pending");

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const decide = () => {
      if (motionQuery.matches || !hasWebGL()) {
        document.documentElement.classList.add("no-motion");
        setMode("still");
        return;
      }
      document.documentElement.classList.remove("no-motion");

      // Coarse pointer or few cores: halve the particle budget and the
      // tessellation of the core rather than dropping frames.
      const cores = navigator.hardwareConcurrency ?? 4;
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const narrow = window.innerWidth < 820;
      sceneState.quality = coarse || cores <= 4 || narrow ? "low" : "high";
      sceneState.compact = narrow;

      setMode("live");
    };

    decide();
    motionQuery.addEventListener("change", decide);

    let lastScroll = 0;
    let ticking = false;

    const readScroll = () => {
      const max =
        document.documentElement.scrollHeight - window.innerHeight || 1;
      const next = Math.min(1, Math.max(0, window.scrollY / max));
      sceneState.velocity = next - lastScroll;
      lastScroll = next;
      sceneState.scroll = next;
      document.documentElement.style.setProperty(
        "--scroll",
        next.toFixed(4),
      );
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(readScroll);
    };

    const onPointer = (e: PointerEvent) => {
      sceneState.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      sceneState.pointerY = -((e.clientY / window.innerHeight) * 2 - 1);
    };

    // Damp the pointer and bleed off scroll velocity on a single rAF loop, so
    // the scene keeps easing even when no events are firing.
    let raf = 0;
    const settle = () => {
      sceneState.smoothX += (sceneState.pointerX - sceneState.smoothX) * 0.06;
      sceneState.smoothY += (sceneState.pointerY - sceneState.smoothY) * 0.06;
      sceneState.velocity *= 0.9;
      raf = requestAnimationFrame(settle);
    };
    raf = requestAnimationFrame(settle);

    readScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      motionQuery.removeEventListener("change", decide);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (mode !== "live") return <StillFrame />;

  return (
    // z-0, not a negative index: a negatively-stacked child paints *behind*
    // the body background, which would hide the whole scene.
    <div className="fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0.55, 8.4], fov: 46, near: 0.1, far: 120 }}
        dpr={[1, sceneState.quality === "high" ? 1.75 : 1.25]}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: "high-performance",
        }}
      >
        <Suspense fallback={null}>
          <SceneContent projectCount={projectCount} />
        </Suspense>
      </Canvas>
    </div>
  );
}
