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
        chromaticAberration={0.08}
        anisotropy={0.3}
        distortion={0.25}
        distortionScale={0.4}
        temporalDistortion={0.15}
        color="#C084FC"
        attenuationColor="#A855F7"
        attenuationDistance={2.4}
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
        color="#2DD4BF"
        emissive="#2DD4BF"
        emissiveIntensity={2.2}
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
              color={i % 2 ? "#C084FC" : "#5EEAD4"}
              emissive={i % 2 ? "#C084FC" : "#5EEAD4"}
              emissiveIntensity={3}
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
      <directionalLight position={[5, 8, 4]} intensity={1.1} color="#C084FC" />
      <pointLight position={[-4, 2, 3]} intensity={40} color="#2DD4BF" distance={14} />
      <pointLight position={[0, 1, -3]} intensity={30} color="#A855F7" distance={12} />

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
