"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useScrollProgress } from "./scroll-context";

type Stop = {
  at: number;
  pos: [number, number, number];
  look: [number, number, number];
};

// Keyframed journey deeper into the grove: hero → industry ring → project gallery → contact orb.
const STOPS: Stop[] = [
  { at: 0.0, pos: [0, 1.4, 7.2], look: [0, 0.6, 0] },
  { at: 0.33, pos: [0.6, 3.4, 8.6], look: [0, 0.1, 0] },
  { at: 0.6, pos: [-0.7, 1.5, 6.2], look: [0, 0.1, 0] },
  { at: 0.85, pos: [0, 1.0, 4.7], look: [0, 0.4, 0] },
  { at: 1.0, pos: [0, 0.85, 4.2], look: [0, 0.45, 0] },
];

function sampleStops(scroll: number) {
  const clamped = Math.min(1, Math.max(0, scroll));
  let a = STOPS[0];
  let b = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (clamped >= STOPS[i].at && clamped <= STOPS[i + 1].at) {
      a = STOPS[i];
      b = STOPS[i + 1];
      break;
    }
  }
  const span = b.at - a.at || 1;
  const t = THREE.MathUtils.smoothstep(clamped, a.at, a.at + span);
  return {
    pos: [
      THREE.MathUtils.lerp(a.pos[0], b.pos[0], t),
      THREE.MathUtils.lerp(a.pos[1], b.pos[1], t),
      THREE.MathUtils.lerp(a.pos[2], b.pos[2], t),
    ] as const,
    look: [
      THREE.MathUtils.lerp(a.look[0], b.look[0], t),
      THREE.MathUtils.lerp(a.look[1], b.look[1], t),
      THREE.MathUtils.lerp(a.look[2], b.look[2], t),
    ] as const,
  };
}

export function CameraRig() {
  const scroll = useScrollProgress();
  const targetPos = useRef(new THREE.Vector3(0, 1.4, 7.2));
  const targetLook = useRef(new THREE.Vector3(0, 0.6, 0));
  const currentLook = useRef(new THREE.Vector3(0, 0.6, 0));

  useFrame((state, delta) => {
    const { pos, look } = sampleStops(scroll);

    // Gentle cursor parallax layered on top of the scripted path.
    const px = state.pointer.x * 0.4;
    const py = state.pointer.y * 0.25;
    targetPos.current.set(pos[0] + px, pos[1] + py, pos[2]);
    targetLook.current.set(look[0], look[1], look[2]);

    // Frame-rate independent damping toward the targets.
    const lerp = 1 - Math.pow(0.0015, delta);
    state.camera.position.lerp(targetPos.current, lerp);
    currentLook.current.lerp(targetLook.current, lerp);
    state.camera.lookAt(currentLook.current);
  });

  return null;
}
