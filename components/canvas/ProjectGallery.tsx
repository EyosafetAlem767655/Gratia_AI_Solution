"use client";

import { Suspense, useRef } from "react";
import { Float, Html, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ProjectRecord, SceneConfig } from "@/lib/types";
import { useScrollProgress, scrollSectionProgress } from "./scroll-context";
import { ProjectScene } from "./ProjectScene";

function ProjectPlaque({
  project,
  index,
  total,
  visible,
}: {
  project: ProjectRecord;
  index: number;
  total: number;
  visible: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const angle = (index / Math.max(total, 1)) * Math.PI * 2;
  const radius = 4;

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y =
      angle + state.clock.elapsedTime * 0.05 + index * 0.2;
    const x = Math.cos(groupRef.current.rotation.y) * radius;
    const z = Math.sin(groupRef.current.rotation.y) * radius;
    groupRef.current.position.set(x, visible * 1.5 - 0.5, z);
  });

  const sceneConfig = project.sceneConfig as SceneConfig | null;
  const imageUrl = project.generatedImageUrl ?? project.companyLogoUrl;

  return (
    <group ref={groupRef} scale={visible}>
      <Float speed={1.5} floatIntensity={0.2}>
        <RoundedBox args={[2.2, 1.6, 0.12]} radius={0.08} smoothness={4} castShadow>
          <meshPhysicalMaterial
            color="#182234"
            emissive="#8B5CF6"
            emissiveIntensity={0.25}
            metalness={0.6}
            roughness={0.25}
            clearcoat={1}
          />
        </RoundedBox>
        <Html
          transform
          occlude
          distanceFactor={4}
          position={[0, 0, 0.08]}
          style={{ width: "220px", pointerEvents: "none" }}
        >
          <div className="rounded-lg border border-[#F59E0B]/30 bg-[#0F172A]/90 p-3 text-[#F8FAFC] backdrop-blur-sm">
            <div className="mb-2 flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={project.companyLogoUrl}
                alt={project.companyName}
                className="h-8 w-8 rounded object-contain bg-white/10"
              />
              <span className="text-sm font-semibold text-[#FBBF24]">
                {project.companyName}
              </span>
            </div>
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                className="mb-2 h-20 w-full rounded object-cover"
              />
            )}
            <p className="text-xs leading-relaxed opacity-90">
              {project.aiSummary ?? project.description}
            </p>
            <blockquote className="mt-2 border-l-2 border-[#F59E0B] pl-2 text-xs italic opacity-75">
              &ldquo;{project.testimonial.slice(0, 120)}
              {project.testimonial.length > 120 ? "…" : ""}&rdquo;
            </blockquote>
          </div>
        </Html>
      </Float>
      {sceneConfig && (
        <group position={[0, -1.4, 0]} scale={0.5}>
          <ProjectScene config={sceneConfig} />
        </group>
      )}
    </group>
  );
}

function EmptyCrystal({ visible }: { visible: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.3;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.2;
    }
  });
  return (
    <group scale={visible} position={[0, 0, 0]}>
      <mesh ref={ref}>
        <icosahedronGeometry args={[0.7, 0]} />
        <meshPhysicalMaterial
          color="#F59E0B"
          emissive="#F59E0B"
          emissiveIntensity={0.4}
          metalness={1}
          roughness={0.14}
          iridescence={1}
          iridescenceIOR={1.5}
          clearcoat={1}
          envMapIntensity={1.5}
        />
      </mesh>
    </group>
  );
}

export function ProjectGallery({ projects }: { projects: ProjectRecord[] }) {
  const scroll = useScrollProgress();
  const progress = scrollSectionProgress(scroll, 0.45, 0.75);

  if (progress <= 0) return null;

  return (
    <group>
      <ambientLight intensity={0.45} />
      <directionalLight position={[-2, 5, 3]} intensity={0.7} color="#C084FC" />
      {projects.length === 0 ? (
        <EmptyCrystal visible={progress} />
      ) : (
        projects.map((project, i) => (
          <Suspense key={project.id} fallback={null}>
            <ProjectPlaque
              project={project}
              index={i}
              total={projects.length}
              visible={progress}
            />
          </Suspense>
        ))
      )}
    </group>
  );
}
