"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { INDUSTRY_INFO, type Industry } from "@/lib/types";
import { ChromeSurface } from "./ChromeSurface";
import { band, sceneState } from "./scene-state";

/**
 * Five forged shards, one per industry, standing at the centre of the five
 * particle clusters. Each silhouette is distinct but none of them is a literal
 * icon — the labels live in the DOM, where type belongs.
 */

const INDUSTRIES = Object.keys(INDUSTRY_INFO) as Industry[];

function ShardGeometry({ industry }: { industry: Industry }) {
  switch (industry) {
    case "industrial":
      // Drawn steel — long, faceted, torqued.
      return <cylinderGeometry args={[0.16, 0.42, 2.4, 6, 1]} />;
    case "financial":
      // Two stacked pyramids: a ledger balanced on its point.
      return <octahedronGeometry args={[1.05, 0]} />;
    case "manufacturing":
      return <torusKnotGeometry args={[0.52, 0.17, 128, 16, 2, 3]} />;
    case "realestate":
      return <boxGeometry args={[0.95, 1.9, 0.95]} />;
    case "ecommerce":
      return <torusGeometry args={[0.72, 0.22, 24, 64]} />;
    default:
      return <icosahedronGeometry args={[0.95, 0]} />;
  }
}

function Shard({ industry, index }: { industry: Industry; index: number }) {
  const group = useRef<THREE.Group>(null);
  const angle = (index / INDUSTRIES.length) * Math.PI * 2 - Math.PI / 2;
  const restY = 0.4 + Math.sin(index * 1.7) * 0.8;

  useFrame((state, delta) => {
    if (!group.current) return;
    const d = Math.min(delta, 0.05);

    // Each shard rises a beat after the one before it.
    const presence = band(sceneState.scroll, 0.13 + index * 0.012, 0.55, 0.08);
    group.current.visible = presence > 0.01;
    group.current.scale.setScalar(Math.max(presence, 0.0001) * 0.5);

    const t = state.clock.elapsedTime;
    group.current.position.set(
      Math.cos(angle) * 6.1,
      restY + (1 - presence) * -2.6 + Math.sin(t * 0.6 + index) * 0.12,
      Math.sin(angle) * 6.1,
    );
    group.current.rotation.y += d * (0.22 + index * 0.04);
    group.current.rotation.x = Math.sin(t * 0.35 + index) * 0.16;
  });

  return (
    <group ref={group} visible={false}>
      <mesh>
        <ShardGeometry industry={industry} />
        <ChromeSurface heat={1.15} tint={1.05} />
      </mesh>
      {/* Molten filament running through the shard's axis. */}
      <mesh scale={[0.04, 3.2, 0.04]}>
        <cylinderGeometry args={[1, 1, 1, 6]} />
        <meshBasicMaterial color="#ffb257" toneMapped={false} />
      </mesh>
    </group>
  );
}

export function IndustryShards() {
  return (
    <group>
      {INDUSTRIES.map((industry, i) => (
        <Shard key={industry} industry={industry} index={i} />
      ))}
    </group>
  );
}
