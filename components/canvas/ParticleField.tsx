"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sceneState, stageFromScroll } from "./scene-state";

/**
 * One GPU-resident particle system carries the entire scroll narrative.
 *
 * Every particle stores four positions — a shell, a constellation, a tunnel and
 * a vortex — and the vertex shader blends between them from a single `uStage`
 * uniform. Nothing is re-uploaded while scrolling; the morph is four `mix()`
 * calls, so 20k particles cost about as much as one.
 *
 *   stage 0 · SHELL        the intelligence, contained
 *   stage 1 · CONSTELLATION five industries, five clusters, one orbit
 *   stage 2 · TUNNEL        the work — the camera flies through it
 *   stage 3 · VORTEX        everything converging on the contact beam
 */

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uStage;
uniform float uSize;
uniform float uPixelRatio;
uniform vec3 uPointer;

attribute vec3 aConstellation;
attribute vec3 aTunnel;
attribute vec3 aVortex;
attribute float aSeed;

varying float vHeat;
varying float vFade;

void main() {
  vec3 p = position;
  p = mix(p, aConstellation, clamp(uStage, 0.0, 1.0));
  p = mix(p, aTunnel, clamp(uStage - 1.0, 0.0, 1.0));
  p = mix(p, aVortex, clamp(uStage - 2.0, 0.0, 1.0));

  // Ambient drift so the field never looks like a frozen point cloud.
  float t = uTime * 0.4 + aSeed * 6.2831;
  p += vec3(sin(t * 0.9), cos(t * 1.13), sin(t * 0.71)) * (0.05 + aSeed * 0.07);

  // The pointer shoulders particles out of the way.
  vec3 away = p - uPointer;
  float reach = smoothstep(2.6, 0.0, length(away));
  p += normalize(away + 0.0001) * reach * 0.7;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  gl_PointSize = uSize * (0.5 + aSeed) * uPixelRatio * (14.0 / max(-mv.z, 0.2));

  // A quarter of the field runs hot, breathing out of phase.
  float pulse = 0.5 + 0.5 * sin(uTime * 1.3 + aSeed * 31.4);
  vHeat = smoothstep(0.72, 1.0, aSeed) * (0.3 + 0.7 * pulse);

  // Fade at both ends of the depth range instead of hard-clipping at the far
  // plane, and don't let anything blow out right in front of the lens.
  vFade = smoothstep(46.0, 26.0, -mv.z) * smoothstep(0.4, 2.2, -mv.z);
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uChrome;
uniform vec3 uMolten;
uniform float uOpacity;

varying float vHeat;
varying float vFade;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d2 = dot(uv, uv);
  if (d2 > 0.25) discard;

  float alpha = smoothstep(0.25, 0.005, d2);
  vec3 col = mix(uChrome, uMolten, vHeat);

  gl_FragColor = vec4(col, alpha * vFade * uOpacity);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/** Deterministic PRNG — the layout must be identical on every reload. */
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
  const rand = mulberry32(0x6a71a);

  const shell = new Float32Array(count * 3);
  const constellation = new Float32Array(count * 3);
  const tunnel = new Float32Array(count * 3);
  const vortex = new Float32Array(count * 3);
  const seeds = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    seeds[i] = rand();

    // ── SHELL ────────────────────────────────────────────────────────────
    // Fibonacci sphere so the surface is evenly covered, with a loose halo of
    // outliers that reads as dust in the light.
    const y = 1 - (i / Math.max(count - 1, 1)) * 2;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const phi = i * GOLDEN_ANGLE;
    const halo = rand() < 0.1;
    const radius = halo ? 3.8 + rand() * 4.5 : 2.55 + (rand() - 0.5) * 0.45;
    shell[i3] = Math.cos(phi) * ring * radius;
    shell[i3 + 1] = y * radius * 0.92;
    shell[i3 + 2] = Math.sin(phi) * ring * radius;

    // ── CONSTELLATION ────────────────────────────────────────────────────
    // Five industry clusters on a ring, plus a thin orbit connecting them.
    if (rand() < 0.72) {
      const cluster = i % 5;
      const a = (cluster / 5) * Math.PI * 2 - Math.PI / 2;
      const spread = 1.05;
      constellation[i3] =
        Math.cos(a) * 6.1 + (rand() + rand() - 1) * spread;
      constellation[i3 + 1] =
        0.4 + Math.sin(cluster * 1.7) * 0.8 + (rand() + rand() - 1) * spread;
      constellation[i3 + 2] =
        Math.sin(a) * 6.1 + (rand() + rand() - 1) * spread;
    } else {
      const a = rand() * Math.PI * 2;
      constellation[i3] = Math.cos(a) * 6.1 + (rand() - 0.5) * 0.16;
      constellation[i3 + 1] = 0.4 + (rand() - 0.5) * 0.16;
      constellation[i3 + 2] = Math.sin(a) * 6.1 + (rand() - 0.5) * 0.16;
    }

    // ── TUNNEL ───────────────────────────────────────────────────────────
    // A corridor the camera travels down. Radius wobbles so the walls read as
    // a structure rather than a cylinder.
    const ta = rand() * Math.PI * 2;
    const tz = -20 + rand() * 30;
    const tr = 5.2 + Math.sin(tz * 0.55 + ta * 2) * 0.8 + rand() * 0.7;
    tunnel[i3] = Math.cos(ta) * tr;
    tunnel[i3 + 1] = Math.sin(ta) * tr * 0.72 + 0.4;
    tunnel[i3 + 2] = tz;

    // ── VORTEX ───────────────────────────────────────────────────────────
    // A funnel tightening upward into a beam behind the contact form.
    const t = i / Math.max(count - 1, 1);
    const vr = Math.pow(1 - t, 1.7) * 6.4 + 0.04;
    const vtheta = t * 30 + seeds[i] * 0.6;
    vortex[i3] = Math.cos(vtheta) * vr;
    vortex[i3 + 1] = -3.4 + t * 8.2;
    vortex[i3 + 2] = Math.sin(vtheta) * vr;
  }

  return { shell, constellation, tunnel, vortex, seeds };
}

export function ParticleField() {
  const points = useRef<THREE.Points>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const high = sceneState.quality === "high";
  const count = high ? 16000 : 5200;

  const targets = useMemo(() => buildTargets(count), [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uStage: { value: 0 },
      // Roughly 1.5–4 device pixels at the hero's camera distance. Anything
      // larger stops reading as a field and starts occluding the copy.
      uSize: { value: high ? 1.6 : 2.3 },
      uPixelRatio: { value: 1 },
      uOpacity: { value: 0 },
      uPointer: { value: new THREE.Vector3(0, 0, 20) },
      uChrome: { value: new THREE.Color("#c3d2e2") },
      uMolten: { value: new THREE.Color("#ff9d2e") },
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

    // Ease in once the first frames are on screen, never pop.
    u.uOpacity.value = THREE.MathUtils.damp(u.uOpacity.value, 0.78, 1.6, d);

    u.uPointer.value.set(
      sceneState.smoothX * 6.5,
      sceneState.smoothY * 3.6,
      2,
    );

    if (points.current) {
      points.current.rotation.y += d * 0.018;
    }
  });

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[targets.shell, 3]}
        />
        <bufferAttribute
          attach="attributes-aConstellation"
          args={[targets.constellation, 3]}
        />
        <bufferAttribute
          attach="attributes-aTunnel"
          args={[targets.tunnel, 3]}
        />
        <bufferAttribute
          attach="attributes-aVortex"
          args={[targets.vortex, 3]}
        />
        <bufferAttribute attach="attributes-aSeed" args={[targets.seeds, 1]} />
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
