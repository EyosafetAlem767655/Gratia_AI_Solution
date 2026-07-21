"use client";

import { Suspense } from "react";
import { ContactShadows, Sparkles } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { CameraRig } from "./CameraRig";
import { HeroScene } from "./HeroScene";
import { IndustryTotems } from "./IndustryTotems";
import { ProjectGallery } from "./ProjectGallery";
import type { ProjectRecord } from "@/lib/types";

function ContactOrb({ scroll }: { scroll: number }) {
  if (scroll < 0.7) return null;
  const t = Math.min(1, (scroll - 0.7) / 0.25);

  return (
    <group position={[0, t * 0.5, 0]} scale={t}>
      <mesh>
        <icosahedronGeometry args={[0.8, 1]} />
        <meshStandardMaterial
          color="#4A7C59"
          roughness={0.35}
          metalness={0.25}
          emissive="#C9A961"
          emissiveIntensity={0.9}
        />
      </mesh>
      <pointLight intensity={1.4} color="#C9A961" distance={6} />
    </group>
  );
}

export function SceneContent({
  projects,
  scroll,
}: {
  projects: ProjectRecord[];
  scroll: number;
}) {
  return (
    <>
      <color attach="background" args={["#12280F"]} />
      <CameraRig />
      <Suspense fallback={null}>
        <HeroScene />
        <IndustryTotems />
        <ProjectGallery projects={projects} />
        <ContactOrb scroll={scroll} />
      </Suspense>

      {/* Ambient golden fireflies drifting through the whole grove */}
      <Sparkles
        count={60}
        scale={[16, 8, 12]}
        position={[0, 2, 0]}
        size={3}
        speed={0.3}
        opacity={0.6}
        color="#C9A961"
      />

      {/* Soft grounding shadow beneath the central elements */}
      <ContactShadows
        position={[0, -1.18, 0]}
        opacity={0.5}
        scale={20}
        blur={2.6}
        far={6}
        color="#0A160A"
      />

      <EffectComposer enableNormalPass={false}>
        <Bloom
          intensity={0.9}
          luminanceThreshold={0.35}
          luminanceSmoothing={0.85}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.25} darkness={0.75} />
      </EffectComposer>
    </>
  );
}
