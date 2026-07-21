"use client";

import { useRef, useState } from "react";
import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { INDUSTRY_INFO, type Industry } from "@/lib/types";
import { useScrollProgress, scrollSectionProgress } from "./scroll-context";

const INDUSTRIES = Object.keys(INDUSTRY_INFO) as Industry[];

function TotemShape({ industry, active }: { industry: Industry; active: number }) {
  const ref = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);
  const info = INDUSTRY_INFO[industry];

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.25;
    const base = 0.6 + active * 0.4;
    const target = base * (hovered ? 1.2 : 1);
    ref.current.scale.setScalar(
      THREE.MathUtils.damp(ref.current.scale.x, target, 8, delta),
    );
    if (matRef.current) {
      const targetGlow = active * 0.5 + (hovered ? 1.1 : 0);
      matRef.current.emissiveIntensity = THREE.MathUtils.damp(
        matRef.current.emissiveIntensity,
        targetGlow,
        8,
        delta,
      );
    }
  });

  return (
    <group
      ref={ref}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      <mesh castShadow>
        {info.shape === "gear" && <torusGeometry args={[0.5, 0.18, 8, 16]} />}
        {info.shape === "chart" && <octahedronGeometry args={[0.65, 0]} />}
        {info.shape === "factory" && <boxGeometry args={[0.9, 0.7, 0.9]} />}
        {info.shape === "building" && (
          <boxGeometry args={[0.5, 1.1, 0.5]} />
        )}
        {info.shape === "cart" && <boxGeometry args={[0.8, 0.5, 0.6]} />}
        <meshStandardMaterial
          ref={matRef}
          color="#8B5E3C"
          roughness={0.7}
          metalness={0.15}
          emissive="#C9A961"
          emissiveIntensity={active * 0.5}
        />
      </mesh>
      {info.shape === "gear" && (
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.3, 12]} />
          <meshStandardMaterial color="#C9A961" metalness={0.3} roughness={0.5} />
        </mesh>
      )}
      {info.shape === "building" && (
        <>
          <mesh position={[0.35, 0, 0]}>
            <boxGeometry args={[0.35, 0.8, 0.35]} />
            <meshStandardMaterial color="#8B5E3C" roughness={0.8} />
          </mesh>
          <mesh position={[-0.35, 0.15, 0]}>
            <boxGeometry args={[0.3, 0.5, 0.3]} />
            <meshStandardMaterial color="#8B5E3C" roughness={0.8} />
          </mesh>
        </>
      )}
    </group>
  );
}

export function IndustryTotems() {
  const scroll = useScrollProgress();
  const progress = scrollSectionProgress(scroll, 0.2, 0.5);

  if (progress <= 0) return null;

  return (
    <group>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 6, 2]} intensity={0.9} color="#F4EDE4" />
      {INDUSTRIES.map((industry, i) => {
        const angle = (i / INDUSTRIES.length) * Math.PI * 2 - Math.PI / 2;
        const radius = 3.2;
        const lift = Math.max(0, progress - i * 0.08) * 2;
        const active = Math.max(0, 1 - Math.abs(progress * 5 - i));

        return (
          <group
            key={industry}
            position={[
              Math.cos(angle) * radius,
              lift - 1,
              Math.sin(angle) * radius,
            ]}
          >
            <TotemShape industry={industry} active={active} />
            <Text
              position={[0, -1.1, 0]}
              fontSize={0.22}
              color="#F4EDE4"
              anchorX="center"
              anchorY="middle"
              maxWidth={2}
            >
              {INDUSTRY_INFO[industry].label}
            </Text>
          </group>
        );
      })}
    </group>
  );
}
