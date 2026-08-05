"use client";

import { useMemo } from "react";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import * as THREE from "three";
import { Backdrop } from "./Backdrop";
import { CameraRig } from "./CameraRig";
import { GridFloor } from "./GridFloor";
import { IndustryShards } from "./IndustryShards";
import { MoltenCore } from "./MoltenCore";
import { Monoliths } from "./Monoliths";
import { ParticleField } from "./ParticleField";
import { sceneState } from "./scene-state";

/**
 * Scene composition. Everything visible is either a raw shader or an
 * additively-blended primitive — there is not a single conventional light in
 * here, which is why it costs so little and still reads as metal.
 */
export function SceneContent({ projectCount }: { projectCount: number }) {
  const high = sceneState.quality === "high";
  const aberration = useMemo(() => new THREE.Vector2(0.0007, 0.0009), []);

  return (
    <>
      <color attach="background" args={["#04060a"]} />
      <fog attach="fog" args={["#04060a", 16, 46]} />

      <CameraRig />

      <Backdrop />
      <GridFloor />
      <ParticleField />
      <MoltenCore />
      <IndustryShards />
      <Monoliths count={projectCount} />

      <EffectComposer enableNormalPass={false} multisampling={0}>
        <Bloom
          intensity={high ? 0.7 : 0.5}
          luminanceThreshold={0.34}
          luminanceSmoothing={0.85}
          mipmapBlur
        />
        <ChromaticAberration
          offset={aberration}
          radialModulation
          modulationOffset={0.42}
        />
        <Noise opacity={0.035} />
        <Vignette eskil={false} offset={0.2} darkness={1.05} />
      </EffectComposer>
    </>
  );
}
