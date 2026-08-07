"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { FoliageMaterial } from "./FoliageMaterial";
import { band, sceneState } from "./scene-state";

/**
 * The grove the camera flies through during the work section.
 *
 * Cultivated machines: milled trunks with lichen canopies, planted in two rows
 * like an orchard rather than scattered like a forest. Two instanced draw calls
 * for the whole thing — trunks and canopies — so the corridor costs about the
 * same as two meshes however many trees stand in it.
 */

const MIN_TREES = 7;

export function Grove({ count }: { count: number }) {
  const trunks = useRef<THREE.InstancedMesh>(null);
  const canopies = useRef<THREE.InstancedMesh>(null);
  const group = useRef<THREE.Group>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const total = Math.max(count, MIN_TREES);
  const canopyPer = 3;

  const trees = useMemo(() => {
    return Array.from({ length: total }, (_, i) => {
      const r = (n: number) => {
        const s = Math.sin(i * 45.32 + n * 91.7) * 43758.5453;
        return s - Math.floor(s);
      };
      const side = i % 2 === 0 ? -1 : 1;
      return {
        side,
        x: side * (5.6 + r(1) * 1.6),
        z: 3 - i * (26 / total),
        height: 5.4 + r(2) * 2.6,
        lean: (r(3) - 0.5) * 0.16,
        phase: r(4) * Math.PI * 2,
      };
    });
  }, [total]);

  useFrame((state) => {
    const trunkMesh = trunks.current;
    const canopyMesh = canopies.current;
    if (!trunkMesh || !canopyMesh || !group.current) return;

    const presence = band(sceneState.scroll, 0.46, 0.84, 0.07);
    group.current.visible = presence > 0.02;
    if (presence <= 0.02) return;

    const t = state.clock.elapsedTime;

    trees.forEach((tree, i) => {
      // Trunks sway from the base, so the whole tree leans as one.
      const sway = Math.sin(t * 0.5 + tree.phase) * 0.03;

      dummy.position.set(tree.x, -3 + (tree.height / 2) * presence, tree.z);
      dummy.rotation.set(sway, tree.phase, tree.lean + sway);
      dummy.scale.set(1, tree.height * presence, 1);
      dummy.updateMatrix();
      trunkMesh.setMatrixAt(i, dummy.matrix);

      for (let c = 0; c < canopyPer; c++) {
        const lift = tree.height * (0.62 + c * 0.17);
        const spread = 1.5 - c * 0.34;
        const drift = Math.sin(t * 0.7 + tree.phase + c) * 0.08;

        dummy.position.set(
          tree.x + Math.cos(tree.phase + c * 2.1) * spread * 0.5 + drift,
          -3 + lift * presence,
          tree.z + Math.sin(tree.phase + c * 2.1) * spread * 0.5,
        );
        dummy.rotation.set(t * 0.06 + c, tree.phase + c, 0);
        dummy.scale.setScalar(spread * presence);
        dummy.updateMatrix();
        canopyMesh.setMatrixAt(i * canopyPer + c, dummy.matrix);
      }
    });

    trunkMesh.instanceMatrix.needsUpdate = true;
    canopyMesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={group} visible={false}>
      <instancedMesh
        ref={trunks}
        args={[undefined, undefined, total]}
        frustumCulled={false}
      >
        {/* Unit height: the per-instance Y scale sets the real height. */}
        <cylinderGeometry args={[0.09, 0.17, 1, 7, 1]} />
        <FoliageMaterial dark="#0d1a12" lit="#3c5f42" rim="#1fd69b" rimPower={3.2} />
      </instancedMesh>

      <instancedMesh
        ref={canopies}
        args={[undefined, undefined, total * canopyPer]}
        frustumCulled={false}
      >
        <icosahedronGeometry args={[0.62, 0]} />
        <FoliageMaterial
          dark="#12301d"
          lit="#5fad55"
          rim="#c3f53c"
          rimPower={2.2}
          opacity={0.72}
          transparent
        />
      </instancedMesh>
    </group>
  );
}
