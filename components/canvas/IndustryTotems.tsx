"use client";

import { useRef, useState } from "react";
import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { INDUSTRY_INFO, type Industry } from "@/lib/types";
import { useScrollProgress, scrollSectionProgress } from "./scroll-context";

const INDUSTRIES = Object.keys(INDUSTRY_INFO) as Industry[];

// Elegant faceted forms per industry (distinct silhouettes, not literal icons).
function Geometry({ industry }: { industry: Industry }) {
  switch (industry) {
    case "industrial":
      return <torusKnotGeometry args={[0.4, 0.13, 160, 20]} />;
    case "financial":
      return <octahedronGeometry args={[0.62, 0]} />;
    case "manufacturing":
      return <icosahedronGeometry args={[0.58, 0]} />;
    case "realestate":
      return <dodecahedronGeometry args={[0.55, 0]} />;
    case "ecommerce":
      return <torusGeometry args={[0.44, 0.18, 28, 80]} />;
    default:
      return <icosahedronGeometry args={[0.55, 0]} />;
  }
}

function Jewel({
  industry,
  active,
  accent,
}: {
  industry: Industry;
  active: number;
  accent: string;
}) {
  const ref = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const [hovered, setHovered] = useState(false);
  const info = INDUSTRY_INFO[industry];

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.3;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.2;
    const target = (0.7 + active * 0.35) * (hovered ? 1.22 : 1);
    ref.current.scale.setScalar(
      THREE.MathUtils.damp(ref.current.scale.x, target, 8, delta),
    );
    if (matRef.current) {
      const glow = 0.15 + active * 0.4 + (hovered ? 0.9 : 0);
      matRef.current.emissiveIntensity = THREE.MathUtils.damp(
        matRef.current.emissiveIntensity,
        glow,
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
        <Geometry industry={industry} />
        <meshPhysicalMaterial
          ref={matRef}
          color={accent}
          emissive={accent}
          emissiveIntensity={0.2}
          metalness={1}
          roughness={0.12}
          clearcoat={1}
          clearcoatRoughness={0.15}
          iridescence={1}
          iridescenceIOR={1.6}
          envMapIntensity={1.6}
        />
      </mesh>
      <Text
        position={[0, -1.05, 0]}
        fontSize={0.2}
        color="#F3EAFF"
        anchorX="center"
        anchorY="middle"
        maxWidth={2}
        outlineWidth={0.004}
        outlineColor="#12091F"
      >
        {info.label}
      </Text>
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
      <directionalLight position={[3, 6, 2]} intensity={0.8} color="#F3EAFF" />
      {INDUSTRIES.map((industry, i) => {
        const angle = (i / INDUSTRIES.length) * Math.PI * 2 - Math.PI / 2;
        const radius = 3.3;
        const lift = Math.max(0, progress - i * 0.08) * 2;
        const active = Math.max(0, 1 - Math.abs(progress * 5 - i));
        const accent = i % 2 === 0 ? "#A855F7" : "#2DD4BF";

        return (
          <group
            key={industry}
            position={[
              Math.cos(angle) * radius,
              lift - 1,
              Math.sin(angle) * radius,
            ]}
          >
            <Jewel industry={industry} active={active} accent={accent} />
          </group>
        );
      })}
    </group>
  );
}
