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
          color="#A855F7"
          emissive="#C084FC"
          emissiveIntensity={0.6}
          metalness={1}
          roughness={0.12}
          iridescence={1}
          iridescenceIOR={1.6}
          clearcoat={1}
          envMapIntensity={1.8}
        />
      </mesh>
      <pointLight intensity={20} color="#2DD4BF" distance={8} />
    </group>
  );
}

/** Local studio lighting baked into an env map — powers glass/metal reflections
 *  without fetching any remote HDRI. */
function StudioEnvironment() {
  return (
    <Environment resolution={256} frames={1}>
      <Lightformer
        intensity={2.4}
        color="#A855F7"
        position={[0, 3, -5]}
        scale={[8, 8, 1]}
      />
      <Lightformer
        intensity={2}
        color="#2DD4BF"
        position={[-5, 1, 3]}
        scale={[5, 5, 1]}
      />
      <Lightformer
        intensity={1.6}
        color="#F3EAFF"
        position={[4, 4, 4]}
        scale={[3, 3, 1]}
      />
      <Lightformer
        intensity={1.2}
        color="#C084FC"
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
      <color attach="background" args={["#0B0413"]} />
      <fog attach="fog" args={["#0B0413", 6, 24]} />
      <CameraRig />
      <StudioEnvironment />

      <Suspense fallback={null}>
        <HeroScene />
        <IndustryTotems />
        <ProjectGallery projects={projects} />
        <ContactOrb scroll={scroll} />
        <ReflectiveFloor />
      </Suspense>

      <Motes count={40} />
      <Sparkles
        count={70}
        scale={[18, 9, 13]}
        position={[0, 2.5, 0]}
        size={3}
        speed={0.3}
        opacity={0.7}
        color="#C084FC"
      />

      <EffectComposer enableNormalPass={false}>
        <Bloom
          intensity={1.1}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.2} darkness={0.85} />
      </EffectComposer>
    </>
  );
}
