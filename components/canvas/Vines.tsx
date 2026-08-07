"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sceneState } from "./scene-state";

/**
 * Vines climbing the seed.
 *
 * Each one is a tube swept along a helix that widens and narrows, and it
 * genuinely *grows*: the fragment shader discards anything past `uGrow` along
 * the tube's length, so the tip advances instead of the whole thing fading in.
 * That difference is most of why the motion reads as organic rather than as a
 * CSS transition wearing a costume.
 */

const vineVert = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vView;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

const vineFrag = /* glsl */ `
uniform float uGrow;
uniform float uTime;
uniform vec3 uStem;
uniform vec3 uTip;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vView;

void main() {
  // vUv.x runs along the tube. Everything past the growing tip is not there
  // yet — discarded, not faded, so the silhouette stays crisp.
  if (vUv.x > uGrow) discard;

  vec3 N = normalize(vNormal);
  vec3 V = normalize(vView);

  // Soft wrap lighting from above; vines are matte, not metal.
  float lambert = max(dot(N, normalize(vec3(-0.3, 0.9, 0.4))), 0.0);
  vec3 col = uStem * (0.22 + lambert * 0.8);

  // The last stretch before the tip is new growth: brighter, still soft.
  float tip = smoothstep(uGrow - 0.14, uGrow, vUv.x);
  col = mix(col, uTip, tip * 0.85);

  // Sap pulsing up the stem.
  float sap = pow(max(sin(vUv.x * 26.0 - uTime * 2.2), 0.0), 14.0);
  col += uTip * sap * 0.5;

  float rim = pow(1.0 - max(dot(N, V), 0.0), 2.6);
  col += uTip * rim * 0.22;

  gl_FragColor = vec4(col, 1.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/** A helix that leans and tightens as it climbs — a vine looking for light. */
function vineCurve(seed: number, turns: number) {
  const points: THREE.Vector3[] = [];
  const steps = 64;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * Math.PI * 2 * turns + seed * 2.4;
    const radius = 1.56 + Math.sin(t * Math.PI) * 0.26 + Math.sin(seed) * 0.08;
    points.push(
      new THREE.Vector3(
        Math.cos(angle) * radius,
        -1.55 + t * 3.2 + Math.sin(t * 5.0 + seed) * 0.08,
        Math.sin(angle) * radius,
      ),
    );
  }
  return new THREE.CatmullRomCurve3(points);
}

function Vine({ seed, turns }: { seed: number; turns: number }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const high = sceneState.quality === "high";

  const geometry = useMemo(
    () =>
      new THREE.TubeGeometry(
        vineCurve(seed, turns),
        high ? 96 : 48,
        0.017,
        high ? 7 : 5,
        false,
      ),
    [seed, turns, high],
  );

  const uniforms = useMemo(
    () => ({
      uGrow: { value: 0 },
      uTime: { value: 0 },
      uStem: { value: new THREE.Color("#2f7d52") },
      uTip: { value: new THREE.Color("#c3f53c") },
    }),
    [],
  );

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05);
    const u = material.current?.uniforms;
    if (!u) return;

    u.uTime.value += d;

    // Grows in on load, then keeps creeping as the page scrolls. Staggered so
    // the vines don't move as one object.
    const target = Math.min(
      1,
      0.28 + u.uTime.value * 0.16 + sceneState.scroll * 0.9 - seed * 0.06,
    );
    u.uGrow.value = THREE.MathUtils.damp(u.uGrow.value, target, 2.2, d);
  });

  return (
    <mesh geometry={geometry}>
      <shaderMaterial
        ref={material}
        vertexShader={vineVert}
        fragmentShader={vineFrag}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export function Vines() {
  const group = useRef<THREE.Group>(null);
  const vines = useMemo(
    () => [
      { seed: 0.4, turns: 2.6 },
      { seed: 2.1, turns: 2.1 },
      { seed: 4.3, turns: 3.1 },
      { seed: 5.6, turns: 1.7 },
    ],
    [],
  );

  useFrame((_, delta) => {
    if (!group.current) return;
    const stage = Math.min(sceneState.scroll * 3.2, 1);
    group.current.visible = stage < 0.98;
    const scale = 1 - stage;
    group.current.scale.setScalar(Math.max(scale, 0.0001));
    group.current.position.y = 0.4 - stage * 0.6;
    group.current.rotation.y += delta * 0.1;
  });

  return (
    <group ref={group} position={[0, 0.4, 0]}>
      {vines.map((v) => (
        <Vine key={v.seed} seed={v.seed} turns={v.turns} />
      ))}
    </group>
  );
}
