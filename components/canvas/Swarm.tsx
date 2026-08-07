"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sceneState, stageFromScroll } from "./scene-state";

/**
 * Spores and fireflies — one system carrying the whole scroll narrative.
 *
 * Each particle stores four positions and the vertex shader blends between them
 * from a single `uStage` uniform, so the morph is three `mix()` calls and
 * nothing is ever re-uploaded. A tenth of them are fireflies: warmer, larger,
 * and blinking on their own clock, which is what stops the field reading as
 * abstract dust.
 *
 *   stage 0 · DRIFT   spores held in the seed's field
 *   stage 1 · GROVES  five clusters, one per industry, on a shared orbit
 *   stage 2 · CANOPY  a corridor of motes between the trees
 *   stage 3 · ASCENT  everything spiralling upward and out
 */

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uStage;
uniform float uSize;
uniform float uPixelRatio;
uniform vec3 uPointer;

attribute vec3 aGroves;
attribute vec3 aCanopy;
attribute vec3 aAscent;
attribute float aSeed;
attribute float aFly;

varying float vGlow;
varying float vFly;
varying float vFade;

void main() {
  vec3 p = position;
  p = mix(p, aGroves, clamp(uStage, 0.0, 1.0));
  p = mix(p, aCanopy, clamp(uStage - 1.0, 0.0, 1.0));
  p = mix(p, aAscent, clamp(uStage - 2.0, 0.0, 1.0));

  // Fireflies wander further and slower than spores do.
  float wander = mix(0.05, 0.34, aFly) + aSeed * 0.06;
  float t = uTime * mix(0.4, 0.22, aFly) + aSeed * 6.2831;
  p += vec3(sin(t * 0.9), cos(t * 1.13), sin(t * 0.71)) * wander;

  // Everything scatters away from the cursor, fireflies more skittishly.
  vec3 away = p - uPointer;
  float reach = smoothstep(2.8, 0.0, length(away));
  p += normalize(away + 0.0001) * reach * mix(0.6, 1.1, aFly);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  float size = uSize * (0.5 + aSeed) * mix(1.0, 2.6, aFly);
  gl_PointSize = size * uPixelRatio * (14.0 / max(-mv.z, 0.2));

  // Fireflies blink; spores just shimmer.
  float blink = 0.5 + 0.5 * sin(uTime * mix(1.2, 2.6, aFly) + aSeed * 31.4);
  vGlow = mix(0.35 + 0.4 * blink, 0.15 + 0.85 * pow(blink, 2.0), aFly);
  vFly = aFly;

  vFade = smoothstep(50.0, 28.0, -mv.z) * smoothstep(0.4, 2.4, -mv.z);
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uSpore;
uniform vec3 uFirefly;
uniform float uOpacity;

varying float vGlow;
varying float vFly;
varying float vFade;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d2 = dot(uv, uv);
  if (d2 > 0.25) discard;

  // Fireflies get a soft halo; spores stay tight and crisp.
  float core = smoothstep(0.25, 0.005, d2);
  float halo = smoothstep(0.25, 0.02, d2);
  float alpha = mix(core, halo * 0.55 + core * 0.45, vFly);

  vec3 col = mix(uSpore, uFirefly, vFly);

  gl_FragColor = vec4(col * (0.6 + vGlow * 0.8), alpha * vFade * vGlow * uOpacity);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/** Deterministic PRNG — the field must be identical on every reload. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function buildTargets(count: number) {
  const rand = mulberry32(0x5eed);

  const drift = new Float32Array(count * 3);
  const groves = new Float32Array(count * 3);
  const canopy = new Float32Array(count * 3);
  const ascent = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const fly = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    seeds[i] = rand();
    fly[i] = rand() < 0.1 ? 1 : 0;

    // ── DRIFT ────────────────────────────────────────────────────────────
    // A shell of spores held in the seed's field, with strays further out.
    const y = 1 - (i / Math.max(count - 1, 1)) * 2;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const phi = i * GOLDEN_ANGLE;
    const stray = rand() < 0.12;
    const radius = stray ? 4.2 + rand() * 5.5 : 2.7 + (rand() - 0.5) * 0.7;
    drift[i3] = Math.cos(phi) * ring * radius;
    drift[i3 + 1] = y * radius * 0.9 + 0.3;
    drift[i3 + 2] = Math.sin(phi) * ring * radius;

    // ── GROVES ───────────────────────────────────────────────────────────
    // Five clusters on a shared orbit, plus the orbit itself.
    if (rand() < 0.74) {
      const cluster = i % 5;
      const a = (cluster / 5) * Math.PI * 2 - Math.PI / 2;
      const spread = 1.15;
      groves[i3] = Math.cos(a) * 6.2 + (rand() + rand() - 1) * spread;
      groves[i3 + 1] =
        0.6 + Math.sin(cluster * 1.7) * 0.9 + (rand() + rand() - 1) * spread;
      groves[i3 + 2] = Math.sin(a) * 6.2 + (rand() + rand() - 1) * spread;
    } else {
      const a = rand() * Math.PI * 2;
      groves[i3] = Math.cos(a) * 6.2 + (rand() - 0.5) * 0.2;
      groves[i3 + 1] = 0.6 + (rand() - 0.5) * 0.2;
      groves[i3 + 2] = Math.sin(a) * 6.2 + (rand() - 0.5) * 0.2;
    }

    // ── CANOPY ───────────────────────────────────────────────────────────
    // Motes filling the corridor the camera flies down.
    const ca = rand() * Math.PI * 2;
    const cz = -22 + rand() * 32;
    const cr = 4.6 + Math.sin(cz * 0.5 + ca * 2) * 1.0 + rand() * 1.4;
    canopy[i3] = Math.cos(ca) * cr;
    canopy[i3 + 1] = Math.sin(ca) * cr * 0.8 + 0.8;
    canopy[i3 + 2] = cz;

    // ── ASCENT ───────────────────────────────────────────────────────────
    // A widening spiral carrying everything up and out of frame.
    const t = i / Math.max(count - 1, 1);
    const ar = Math.pow(t, 0.7) * 6.8 + 0.3;
    const atheta = t * 26 + seeds[i] * 0.8;
    ascent[i3] = Math.cos(atheta) * ar;
    ascent[i3 + 1] = -2.6 + t * 9.0;
    ascent[i3 + 2] = Math.sin(atheta) * ar;
  }

  return { drift, groves, canopy, ascent, seeds, fly };
}

export function Swarm() {
  const points = useRef<THREE.Points>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const high = sceneState.quality === "high";
  const count = high ? 9000 : 3200;

  const targets = useMemo(() => buildTargets(count), [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uStage: { value: 0 },
      // Roughly 1.5–4 device pixels for spores at hero distance; fireflies run
      // ~2.6x that. Larger and the field starts occluding the copy.
      uSize: { value: high ? 1.7 : 2.4 },
      uPixelRatio: { value: 1 },
      uOpacity: { value: 0 },
      uPointer: { value: new THREE.Vector3(0, 0, 20) },
      uSpore: { value: new THREE.Color("#a9d9b4") },
      uFirefly: { value: new THREE.Color("#ffc46b") },
    }),
    [high],
  );

  useFrame((state, delta) => {
    const d = Math.min(delta, 0.05);
    const u = material.current?.uniforms;
    if (!u) return;

    u.uTime.value += d;
    u.uPixelRatio.value = state.viewport.dpr;

    u.uStage.value = THREE.MathUtils.damp(
      u.uStage.value,
      stageFromScroll(sceneState.scroll),
      7,
      d,
    );

    u.uOpacity.value = THREE.MathUtils.damp(u.uOpacity.value, 0.9, 1.6, d);

    u.uPointer.value.set(
      sceneState.smoothX * 6.5,
      sceneState.smoothY * 3.6,
      2,
    );

    if (points.current) points.current.rotation.y += d * 0.015;
  });

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[targets.drift, 3]}
        />
        <bufferAttribute attach="attributes-aGroves" args={[targets.groves, 3]} />
        <bufferAttribute attach="attributes-aCanopy" args={[targets.canopy, 3]} />
        <bufferAttribute attach="attributes-aAscent" args={[targets.ascent, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[targets.seeds, 1]} />
        <bufferAttribute attach="attributes-aFly" args={[targets.fly, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
