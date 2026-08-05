"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ChromeSurface } from "./ChromeSurface";
import { band, sceneState } from "./scene-state";

/**
 * Chrome slabs standing along the walls of the tunnel — one per shipped
 * project, a minimum of six so the corridor never looks empty.
 *
 * They carry no text. The 3D layer sets the mood; the case-study copy lives in
 * the DOM where it can be read, selected and indexed.
 */

const MIN_SLABS = 6;

function Monolith({ index, total }: { index: number; total: number }) {
  const group = useRef<THREE.Group>(null);

  const { side, z, rot, height } = useMemo(() => {
    const side = index % 2 === 0 ? -1 : 1;
    return {
      side,
      z: 2 - index * (22 / total),
      rot: side * -0.58,
      height: 4.2 + ((index * 7) % 5) * 0.4,
    };
  }, [index, total]);

  useFrame((state) => {
    if (!group.current) return;
    const presence = band(sceneState.scroll, 0.5, 0.82, 0.06);
    group.current.visible = presence > 0.01;
    if (presence <= 0.01) return;

    const t = state.clock.elapsedTime;
    group.current.position.set(
      side * (6.6 + Math.sin(index) * 0.35),
      0.2 + Math.sin(t * 0.4 + index) * 0.1,
      z,
    );
    group.current.rotation.y = rot + Math.sin(t * 0.25 + index) * 0.06;
    group.current.scale.setScalar(presence);
  });

  return (
    <group ref={group} visible={false}>
      <mesh>
        <boxGeometry args={[2.1, height, 0.09]} />
        <ChromeSurface heat={0.8} tint={0.95} />
      </mesh>
      {/* Heated leading edge — the only thing that reads at speed. */}
      <mesh position={[side * -1.07, 0, 0.01]}>
        <boxGeometry args={[0.035, height * 0.86, 0.11]} />
        <meshBasicMaterial color="#ffab45" toneMapped={false} />
      </mesh>
    </group>
  );
}

export function Monoliths({ count }: { count: number }) {
  const total = Math.max(count, MIN_SLABS);
  const slabs = useMemo(
    () => Array.from({ length: total }, (_, i) => i),
    [total],
  );

  return (
    <group>
      {slabs.map((i) => (
        <Monolith key={i} index={i} total={total} />
      ))}
    </group>
  );
}
