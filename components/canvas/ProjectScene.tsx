"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { SceneConfig } from "@/lib/types";

// Deterministic, pure pseudo-random in [0,1) — avoids impure Math.random during render.
function seeded(n: number) {
  const s = Math.sin(n * 78.233 + 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

function ShapeMesh({ config }: { config: SceneConfig }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y += config.rotationSpeed * 0.01;
    ref.current.rotation.x =
      Math.sin(state.clock.elapsedTime * config.rotationSpeed) * 0.12;
  });

  const shape = config.primaryShape;

  return (
    <mesh ref={ref} scale={config.scale} castShadow>
      {shape === "gear" && <torusKnotGeometry args={[0.4, 0.13, 128, 18]} />}
      {shape === "building" && <dodecahedronGeometry args={[0.55, 0]} />}
      {shape === "chart" && <octahedronGeometry args={[0.58, 0]} />}
      {shape === "cart" && <torusGeometry args={[0.42, 0.17, 24, 64]} />}
      {shape === "factory" && <icosahedronGeometry args={[0.56, 0]} />}
      {shape === "cube" && <boxGeometry args={[0.62, 0.62, 0.62]} />}
      <meshPhysicalMaterial
        color={config.secondaryColor}
        emissive={config.accentColor}
        emissiveIntensity={0.3}
        metalness={1}
        roughness={0.14}
        clearcoat={1}
        clearcoatRoughness={0.15}
        iridescence={1}
        iridescenceIOR={1.5}
        envMapIntensity={1.4}
      />
    </mesh>
  );
}

function MiniParticles({
  type,
  color,
}: {
  type: SceneConfig["particleType"];
  color: string;
}) {
  const ref = useRef<THREE.Points>(null);
  const count = 30;

  const positions = useMemo(
    () => Float32Array.from({ length: count * 3 }, (_, i) => (seeded(i) - 0.5) * 2),
    [],
  );

  useFrame(() => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += type === "leaves" ? -0.01 : 0.005;
      if (Math.abs(pos[i * 3 + 1]) > 1.2) {
        pos[i * 3 + 1] = -1.2;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        size={type === "coins" ? 0.06 : 0.045}
        color={color}
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function ProjectScene({ config }: { config: SceneConfig }) {
  return (
    <group>
      <ambientLight intensity={0.5} />
      <pointLight
        position={[2, 2, 2]}
        intensity={6}
        color={config.accentColor}
        distance={8}
      />
      <ShapeMesh config={config} />
      <MiniParticles type={config.particleType} color={config.accentColor} />
    </group>
  );
}
