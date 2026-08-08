"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sceneState, stageFromScroll, window01 } from "./scene-state";

/** Dark titanium nodes wake among the roots as the organic world becomes an
 * intelligent infrastructure. One instanced draw call keeps the effect cheap. */
export function NeuralNetwork() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const high = sceneState.quality === "high";
  const count = high ? 42 : 22;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const nodes = useMemo(() => Array.from({ length: count }, (_, i) => ({
    x: (i % 2 === 0 ? -1 : 1) * (2.8 + ((i * 17) % 11) * 0.17),
    y: -1.1 + ((i * 7) % 9) * 0.42,
    z: -2 - (i / count) * 25,
    scale: 0.08 + ((i * 13) % 7) * 0.012,
    phase: i * 0.61,
  })), [count]);

  useFrame((state) => {
    if (!mesh.current || !sceneState.visible) return;
    const stage = stageFromScroll(sceneState.scroll);
    const presence = window01(stage, 0.7, 2.2) * (1 - window01(stage, 3.35, 4));
    mesh.current.visible = presence > 0.01;
    nodes.forEach((node, i) => {
      const pulse = 0.72 + Math.sin(state.clock.elapsedTime * 1.5 + node.phase) * 0.28;
      const s = node.scale * pulse * presence;
      dummy.position.set(node.x, node.y + Math.sin(node.phase) * 0.15, node.z);
      dummy.rotation.set(node.phase * 0.2, node.phase, stage * 0.12);
      dummy.scale.set(s, s * 2.8, s);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false} visible={false}>
      <octahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color="#071a1b" emissive="#32e6df" emissiveIntensity={2.4} roughness={0.28} metalness={0.82} />
    </instancedMesh>
  );
}
