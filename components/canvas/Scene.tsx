"use client";

import { Suspense } from "react";
import { Environment, Lightformer, Sparkles } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { CameraRig } from "./CameraRig";
import { HeroScene } from "./HeroScene";
import { IndustryTotems } from "./IndustryTotems";
import { ProjectGallery } from "./ProjectGallery";
import { Motes, ReflectiveFloor } from "./primitives";
import type { ProjectRecord } from "@/lib/types";

function ContactOrb({ scroll }: { scroll: number }) {
  if (scroll < 0.7) return null;
  const t = Math.min(1, (scroll - 0.7) / 0.25);

  return (
    <group position={[0, t * 0.5, 0]} scale={t}>
      <mesh>
        <icosahedronGeometry args={[0.85, 0]} />
        <meshPhysicalMaterial
          color="#1E293B"
          emissive="#F59E0B"
          emissiveIntensity={0.5}
          metalness={1}
          roughness={0.14}
          iridescence={1}
          iridescenceIOR={1.6}
          clearcoat={1}
          envMapIntensity={1.6}
        />
      </mesh>
      <pointLight intensity={16} color="#8B5CF6" distance={8} />
    </group>
  );
}

/** Local studio lighting baked into an env map — powers glass/metal reflections
 *  without fetching any remote HDRI. */
function StudioEnvironment() {
  return (
    <Environment resolution={256} frames={1}>
      <Lightformer
        intensity={2.2}
        color="#F59E0B"
        position={[0, 3, -5]}
        scale={[8, 8, 1]}
      />
      <Lightformer
        intensity={1.8}
        color="#8B5CF6"
        position={[-5, 1, 3]}
        scale={[5, 5, 1]}
      />
      <Lightformer
        intensity={1.5}
        color="#F8FAFC"
        position={[4, 4, 4]}
        scale={[3, 3, 1]}
      />
      <Lightformer
        intensity={1}
        color="#FBBF24"
        position={[0, -3, 2]}
        scale={[6, 3, 1]}
      />
    </Environment>
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
      <color attach="background" args={["#0A0F1E"]} />
      <fog attach="fog" args={["#0A0F1E", 6, 24]} />
      <CameraRig />
      <StudioEnvironment />

      <Suspense fallback={null}>
        <HeroScene />
        <IndustryTotems />
        <ProjectGallery projects={projects} />
        <ContactOrb scroll={scroll} />
        <ReflectiveFloor />
      </Suspense>

      <Motes count={32} />
      <Sparkles
        count={45}
        scale={[18, 9, 13]}
        position={[0, 2.5, 0]}
        size={2.5}
        speed={0.25}
        opacity={0.5}
        color="#F59E0B"
      />

      <EffectComposer enableNormalPass={false}>
        <Bloom
          intensity={0.7}
          luminanceThreshold={0.28}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.22} darkness={0.9} />
      </EffectComposer>
    </>
  );
}
