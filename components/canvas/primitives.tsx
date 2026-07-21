"use client";

import { useMemo, useRef } from "react";
import { MeshReflectorMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Deterministic, pure pseudo-random in [0,1) — avoids impure Math.random during render.
function seeded(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

const MOTE_TINTS = ["#C084FC", "#2DD4BF", "#A855F7", "#5EEAD4"];

/** Slow-drifting brand-colored specks that give the void a sense of depth. */
export function Motes({ count = 90 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const { positions, colors, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const tint = new THREE.Color();
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (seeded(i * 3) - 0.5) * 22;
      positions[i * 3 + 1] = seeded(i * 3 + 1) * 9 + 0.5;
      positions[i * 3 + 2] = (seeded(i * 3 + 2) - 0.5) * 16;
      tint.set(MOTE_TINTS[Math.floor(seeded(i + 0.5) * MOTE_TINTS.length)]);
      colors[i * 3] = tint.r;
      colors[i * 3 + 1] = tint.g;
      colors[i * 3 + 2] = tint.b;
      phases[i] = seeded(i + 0.9) * Math.PI * 2;
    }
    return { positions, colors, phases };
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.015;
    const t = state.clock.elapsedTime;
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += Math.sin(t * 0.4 + phases[i]) * 0.0012;
      pos[i * 3] += Math.cos(t * 0.3 + phases[i]) * 0.0009;
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
        size={0.09}
        vertexColors
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** Mirror-like floor that catches the glow of the crystals above it. */
export function ReflectiveFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.25, 0]}>
      <planeGeometry args={[60, 60]} />
      <MeshReflectorMaterial
        resolution={512}
        mirror={0.55}
        blur={[380, 110]}
        mixBlur={1.1}
        mixStrength={2.2}
        roughness={0.85}
        depthScale={1.1}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.3}
        color="#160A26"
        metalness={0.55}
      />
    </mesh>
  );
}
