"use client";

import { useState } from "react";
import { PerformanceMonitor } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useThree } from "@react-three/fiber";
import { CameraRig } from "./CameraRig";
import { Flock } from "./Flock";
import { Grove } from "./Grove";
import { SeedCore } from "./SeedCore";
import { Sky } from "./Sky";
import { Swarm } from "./Swarm";
import { Terrain } from "./Terrain";
import { Vines } from "./Vines";
import { sceneState } from "./scene-state";

/**
 * Scene composition.
 *
 * Bloom is the only postprocessing pass. The previous build ran four
 * full-screen passes — bloom, chromatic aberration, noise and vignette — at up
 * to 1.75x device pixel ratio, which is four 4K-ish blits per frame on a
 * retina display and was a large part of the scroll stutter. Grain and vignette
 * now live in CSS, where the compositor draws them for nothing.
 */
export function SceneContent({ projectCount }: { projectCount: number }) {
  const high = sceneState.quality === "high";
  const setDpr = useThree((s) => s.setDpr);
  const [degraded, setDegraded] = useState(false);

  const ceiling = high ? 1.5 : 1.15;

  return (
    <>
      <color attach="background" args={["#030a07"]} />
      <fog attach="fog" args={["#030a07", 18, 52]} />

      {/* Watches real frame times and trades resolution for smoothness before
          the visitor ever notices a dropped frame. */}
      <PerformanceMonitor
        bounds={() => [45, 60]}
        onIncline={() => {
          setDpr(ceiling);
          setDegraded(false);
        }}
        onDecline={() => {
          setDpr(1);
          setDegraded(true);
        }}
        flipflops={3}
        onFallback={() => {
          setDpr(1);
          setDegraded(true);
        }}
      />

      <CameraRig />

      <Sky />
      <Terrain />
      <Swarm />
      <SeedCore />
      <Vines />
      <Flock />
      <Grove count={projectCount} />

      <EffectComposer enableNormalPass={false} multisampling={0}>
        <Bloom
          intensity={degraded ? 0.45 : high ? 0.85 : 0.6}
          luminanceThreshold={0.32}
          luminanceSmoothing={0.85}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}
