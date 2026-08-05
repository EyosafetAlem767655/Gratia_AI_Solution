"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CHROME_ENV } from "./glsl";

/**
 * Shared chrome material for every solid object in the scene.
 *
 * The environment is evaluated analytically in the fragment shader, so nothing
 * here needs a cubemap, an HDRI fetch, or a render-to-texture probe — and every
 * metal surface on the site is lit by provably the same imaginary studio.
 */

const vertexShader = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uMolten;
uniform float uHeat;
uniform float uTint;
uniform float uOpacity;

varying vec3 vNormal;
varying vec3 vView;

${CHROME_ENV}

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vView);
  vec3 R = reflect(-V, N);

  vec3 col = chromeEnv(R, uMolten) * uTint;

  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  col += uMolten * fresnel * uHeat;

  gl_FragColor = vec4(col, uOpacity);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export function ChromeSurface({
  heat = 0.9,
  tint = 1,
  opacity = 1,
  transparent = false,
}: {
  /** Strength of the molten rim light. */
  heat?: number;
  /** Overall brightness of the reflected studio. */
  tint?: number;
  opacity?: number;
  transparent?: boolean;
}) {
  const material = useRef<THREE.ShaderMaterial>(null);

  // Seeded once. Prop changes are pushed through the material ref below rather
  // than by rebuilding the object, so the shader is never recompiled.
  const uniforms = useMemo(
    () => ({
      uMolten: { value: new THREE.Color("#ff9d2e") },
      uHeat: { value: 0.9 },
      uTint: { value: 1 },
      uOpacity: { value: 1 },
    }),
    [],
  );

  useFrame(() => {
    const u = material.current?.uniforms;
    if (!u) return;
    u.uHeat.value = heat;
    u.uTint.value = tint;
    u.uOpacity.value = opacity;
  });

  return (
    <shaderMaterial
      ref={material}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      uniforms={uniforms}
      transparent={transparent}
      depthWrite={!transparent}
    />
  );
}
