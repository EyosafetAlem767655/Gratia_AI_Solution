"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sceneState, smootherstep } from "./scene-state";

/**
 * The camera is the narrator: it holds on the core, lifts to take in the five
 * industries, dives down the corridor of work, then pulls out and up into the
 * contact vortex. Pointer parallax and a whisper of roll ride on top.
 */

type Stop = {
  at: number;
  pos: [number, number, number];
  look: [number, number, number];
  roll: number;
};

const STOPS: Stop[] = [
  // Hero — eye level with the melt.
  { at: 0.0, pos: [0, 0.55, 8.4], look: [0, 0.35, 0], roll: 0 },
  { at: 0.16, pos: [0.4, 1.1, 7.6], look: [0, 0.3, 0], roll: -0.012 },
  // Services — lifted and oblique, taking in the whole ring.
  { at: 0.34, pos: [0.2, 3.1, 9.2], look: [0, 0.1, 0], roll: 0.02 },
  // Approaching the corridor mouth as Method scrolls past.
  { at: 0.53, pos: [-0.4, 1.0, 5.4], look: [0, 0.4, -8], roll: -0.02 },
  // Inside the corridor, alongside the Work case studies.
  { at: 0.66, pos: [0.2, 0.5, -1.6], look: [0, 0.4, -14], roll: 0.03 },
  { at: 0.76, pos: [-0.2, 0.6, -6.0], look: [0, 0.5, -18], roll: -0.025 },
  // Back out and around for the vortex. This has to finish *before* Contact
  // fills the viewport, or the camera spends that whole section pointed at
  // empty space behind the corridor.
  { at: 0.87, pos: [0, 1.2, 8.8], look: [0, 0.9, 0], roll: 0.015 },
  { at: 1.0, pos: [0, 1.5, 7.2], look: [0, 1.1, 0], roll: 0 },
];

function sample(scroll: number) {
  const s = Math.min(1, Math.max(0, scroll));
  let a = STOPS[0];
  let b = STOPS[STOPS.length - 1];

  for (let i = 0; i < STOPS.length - 1; i++) {
    if (s >= STOPS[i].at && s <= STOPS[i + 1].at) {
      a = STOPS[i];
      b = STOPS[i + 1];
      break;
    }
  }

  const t = smootherstep((s - a.at) / (b.at - a.at || 1));
  return { a, b, t };
}

export function CameraRig() {
  const targetPos = useRef(new THREE.Vector3(0, 0.55, 8.4));
  const targetLook = useRef(new THREE.Vector3(0, 0.35, 0));
  const currentLook = useRef(new THREE.Vector3(0, 0.35, 0));
  const roll = useRef(0);

  useFrame((state, delta) => {
    const d = Math.min(delta, 0.05);
    const { a, b, t } = sample(sceneState.scroll);

    // Parallax shrinks as the camera enters the corridor — being jostled at
    // speed in a tight space reads as a mistake, not as depth.
    const parallax =
      1 - Math.min(1, Math.max(0, (sceneState.scroll - 0.53) * 4)) * 0.85;

    targetPos.current.set(
      THREE.MathUtils.lerp(a.pos[0], b.pos[0], t) +
        sceneState.smoothX * 0.55 * parallax,
      THREE.MathUtils.lerp(a.pos[1], b.pos[1], t) +
        sceneState.smoothY * 0.35 * parallax,
      THREE.MathUtils.lerp(a.pos[2], b.pos[2], t),
    );

    targetLook.current.set(
      THREE.MathUtils.lerp(a.look[0], b.look[0], t),
      THREE.MathUtils.lerp(a.look[1], b.look[1], t),
      THREE.MathUtils.lerp(a.look[2], b.look[2], t),
    );

    // Frame-rate independent damping toward both targets.
    const k = 1 - Math.pow(0.0012, d);
    state.camera.position.lerp(targetPos.current, k);
    currentLook.current.lerp(targetLook.current, k);
    state.camera.lookAt(currentLook.current);

    roll.current = THREE.MathUtils.damp(
      roll.current,
      THREE.MathUtils.lerp(a.roll, b.roll, t) + sceneState.velocity * 0.3,
      4,
      d,
    );
    state.camera.rotation.z += roll.current;
  });

  return null;
}
