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
      Math.sin(state.clock.elapsedTime * config.rotationSpeed) * 0.1;
  });

  const shape = config.primaryShape;

  return (
    <mesh ref={ref} scale={config.scale} castShadow>
      {shape === "gear" && <torusGeometry args={[0.5, 0.15, 12, 24]} />}
      {shape === "building" && <boxGeometry args={[0.6, 1, 0.6]} />}
      {shape === "chart" && <octahedronGeometry args={[0.55, 0]} />}
      {shape === "cart" && <boxGeometry args={[0.7, 0.45, 0.5]} />}
      {shape === "factory" && <boxGeometry args={[0.8, 0.6, 0.8]} />}
      {shape === "cube" && <boxGeometry args={[0.65, 0.65, 0.65]} />}
      <meshStandardMaterial
        color={config.secondaryColor}
        roughness={0.7}
        metalness={0.15}
        emissive={config.accentColor}
        emissiveIntensity={0.25}
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
        size={type === "coins" ? 0.06 : 0.04}
        color={color}
        transparent
        opacity={0.8}
      />
    </points>
  );
}

export function ProjectScene({ config }: { config: SceneConfig }) {
  return (
    <group>
      <ambientLight intensity={0.5} />
      <pointLight position={[2, 2, 2]} intensity={0.8} color={config.accentColor} />
      <ShapeMesh config={config} />
      <MiniParticles type={config.particleType} color={config.accentColor} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]}>
        <circleGeometry args={[1.2, 32]} />
        <meshStandardMaterial color="#2D4A2A" roughness={1} />
      </mesh>
    </group>
  );
}
