"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function WoodMaterial({
  color = "#8B5E3C",
  roughness = 0.85,
  metalness = 0.05,
}: {
  color?: string;
  roughness?: number;
  metalness?: number;
}) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={roughness}
      metalness={metalness}
    />
  );
}

const LEAF_TINTS = ["#A8C5A0", "#C9A961", "#8B5E3C", "#4A7C59"];

// Deterministic, pure pseudo-random in [0,1) — avoids impure Math.random during render.
function seeded(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export function LeafParticles({ count = 80 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const { positions, colors, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const tint = new THREE.Color();
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (seeded(i * 3) - 0.5) * 20;
      positions[i * 3 + 1] = seeded(i * 3 + 1) * 8 + 1;
      positions[i * 3 + 2] = (seeded(i * 3 + 2) - 0.5) * 16;
      tint.set(LEAF_TINTS[Math.floor(seeded(i + 0.5) * LEAF_TINTS.length)]);
      colors[i * 3] = tint.r;
      colors[i * 3 + 1] = tint.g;
      colors[i * 3 + 2] = tint.b;
      phases[i] = seeded(i + 0.9) * Math.PI * 2;
    }
    return { positions, colors, phases };
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.02;
    const t = state.clock.elapsedTime;
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] -= 0.008;
      // Gentle horizontal sway as leaves fall.
      pos[i * 3] += Math.sin(t * 0.6 + phases[i]) * 0.0015;
      if (pos[i * 3 + 1] < 0) {
        pos[i * 3 + 1] = 8 + Math.random() * 2;
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
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.8}
        depthWrite={false}
      />
    </points>
  );
}

export function ForestFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]} receiveShadow>
      <planeGeometry args={[40, 40, 32, 32]} />
      <meshStandardMaterial color="#2D4A2A" roughness={1} metalness={0} />
    </mesh>
  );
}
