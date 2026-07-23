"use client";

import { useRef } from "react";
import { Float, MeshTransmissionMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useScrollProgress, scrollSectionProgress } from "./scroll-context";
import { Motes } from "./primitives";

function GlassCrystal() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.25;
    ref.current.rotation.x =
      Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
  });

  return (
    <mesh ref={ref} scale={1.7}>
      <dodecahedronGeometry args={[1, 0]} />
      <MeshTransmissionMaterial
        transmission={1}
        thickness={1.4}
        roughness={0.08}
        ior={1.42}
        chromaticAberration={0.06}
        anisotropy={0.3}
        distortion={0.2}
        distortionScale={0.35}
        temporalDistortion={0.12}
        color="#FBBF24"
        attenuationColor="#F59E0B"
        attenuationDistance={2.6}
        samples={6}
        resolution={256}
      />
    </mesh>
  );
}

function OrbitRing() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.z += delta * 0.15;
    ref.current.rotation.x = Math.PI / 2.6;
    ref.current.rotation.y = state.clock.elapsedTime * 0.1;
  });

  return (
    <mesh ref={ref} scale={2.9}>
      <torusGeometry args={[1, 0.02, 16, 128]} />
      <meshStandardMaterial
        color="#8B5CF6"
        emissive="#8B5CF6"
        emissiveIntensity={1.8}
        roughness={0.3}
        metalness={0.8}
        toneMapped={false}
      />
    </mesh>
  );
}

function SparkNodes() {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.4;
  });
  const nodes = [0, 1, 2, 3, 4, 5];
  return (
    <group ref={group}>
      {nodes.map((i) => {
        const a = (i / nodes.length) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 2.6, Math.sin(a * 1.5) * 0.4, Math.sin(a) * 2.6]}>
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshStandardMaterial
              color={i % 2 ? "#F59E0B" : "#A78BFA"}
              emissive={i % 2 ? "#F59E0B" : "#A78BFA"}
              emissiveIntensity={2.6}
              toneMapped={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export function HeroScene() {
  const scroll = useScrollProgress();
  const progress = 1 - scrollSectionProgress(scroll, 0, 0.25);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    // Subtle cursor parallax on the whole centerpiece.
    groupRef.current.rotation.y = state.pointer.x * 0.15;
    groupRef.current.rotation.x = -state.pointer.y * 0.08;
  });

  return (
    <group visible={progress > 0.05}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 4]} intensity={1.1} color="#FBBF24" />
      <pointLight position={[-4, 2, 3]} intensity={32} color="#F59E0B" distance={14} />
      <pointLight position={[0, 1, -3]} intensity={26} color="#8B5CF6" distance={12} />

      <Motes count={progress > 0.3 ? 100 : 50} />

      <group ref={groupRef} position={[0, 0.5, 0]} scale={progress}>
        <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.5}>
          <GlassCrystal />
        </Float>
        <OrbitRing />
        <SparkNodes />
      </group>
    </group>
  );
}
