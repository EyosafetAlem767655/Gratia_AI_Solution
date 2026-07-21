"use client";

import { useRef } from "react";
import { Float, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useScrollProgress, scrollSectionProgress } from "./scroll-context";
import { ForestFloor, LeafParticles } from "./primitives";

export function HeroScene() {
  const scroll = useScrollProgress();
  const progress = 1 - scrollSectionProgress(scroll, 0, 0.25);
  const logoRef = useRef<THREE.Group>(null);
  const logoTexture = useTexture("/logo.png");

  useFrame((state) => {
    if (logoRef.current) {
      // Idle drift plus a subtle response to the cursor for an interactive feel.
      logoRef.current.rotation.y =
        Math.sin(state.clock.elapsedTime * 0.3) * 0.15 +
        state.pointer.x * 0.25;
      logoRef.current.rotation.x = -state.pointer.y * 0.12;
      logoRef.current.position.y =
        Math.sin(state.clock.elapsedTime * 0.5) * 0.08 + 0.5;
    }
  });

  return (
    <group visible={progress > 0.05}>
      <fog attach="fog" args={["#12280F", 5, 20]} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 8, 4]} intensity={1.4} color="#C9A961" />
      <pointLight position={[-4, 3, -2]} intensity={0.7} color="#4A7C59" />
      {/* Warm back-glow so the logo blooms against the dark grove */}
      <pointLight position={[0, 1, -1.5]} intensity={2.2} color="#C9A961" distance={8} />

      <ForestFloor />
      <LeafParticles count={progress > 0.3 ? 100 : 40} />

      <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.4}>
        <group ref={logoRef} scale={progress * 1.8} position={[0, 0.5, 0]}>
          <mesh>
            <planeGeometry args={[3.2, 1.8]} />
            <meshStandardMaterial
              map={logoTexture}
              transparent
              toneMapped={false}
            />
          </mesh>
          <mesh position={[0, 0, -0.05]}>
            <planeGeometry args={[3.6, 2.1]} />
            <meshStandardMaterial
              color="#4A7C59"
              transparent
              opacity={0.2}
              emissive="#C9A961"
              emissiveIntensity={0.7}
            />
          </mesh>
        </group>
      </Float>

      {/* Decorative tree trunks */}
      {[
        [-4, -0.5, -2],
        [4.5, -0.5, -1],
        [-3, -0.5, 3],
        [3, -0.5, 2.5],
      ].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.15, 0.22, 1.6, 8]} />
            <meshStandardMaterial color="#5C4033" roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.8, 0]}>
            <coneGeometry args={[0.9, 1.4, 8]} />
            <meshStandardMaterial color="#4A7C59" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
