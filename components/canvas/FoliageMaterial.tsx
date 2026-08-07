"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Unlit foliage shading, without any lights in the scene.
 *
 * `meshBasicMaterial` gives every face the same colour, which turns a low-poly
 * canopy into a flat hexagon and a trunk into a bar. This costs the same and
 * gets form back: one soft key from the canopy above, a cool bounce from the
 * moss below, and a rim so leaves separate from the dark behind them.
 *
 * Instancing-aware, so the grove still draws in one call per mesh.
 */

const vertexShader = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;

void main() {
  vec4 local = vec4(position, 1.0);
  vec3 n = normal;

  #ifdef USE_INSTANCING
    local = instanceMatrix * local;
    n = mat3(instanceMatrix) * n;
  #endif

  vNormal = normalize(normalMatrix * n);
  vec4 mv = modelViewMatrix * local;
  vView = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uDark;
uniform vec3 uLit;
uniform vec3 uRim;
uniform float uRimPower;
uniform float uOpacity;

varying vec3 vNormal;
varying vec3 vView;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vView);

  // Canopy light from above and slightly behind.
  float key = max(dot(N, normalize(vec3(-0.25, 0.9, 0.35))), 0.0);
  // Cool bounce off the moss.
  float bounce = max(dot(N, vec3(0.0, -1.0, 0.0)), 0.0) * 0.28;

  vec3 col = mix(uDark, uLit, key * 0.85 + bounce);

  float rim = pow(1.0 - max(dot(N, V), 0.0), uRimPower);
  col += uRim * rim * 0.5;

  gl_FragColor = vec4(col, uOpacity);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export function FoliageMaterial({
  dark,
  lit,
  rim,
  rimPower = 2.6,
  opacity = 1,
  transparent = false,
}: {
  dark: string;
  lit: string;
  rim: string;
  rimPower?: number;
  opacity?: number;
  transparent?: boolean;
}) {
  const material = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uDark: { value: new THREE.Color(dark) },
      uLit: { value: new THREE.Color(lit) },
      uRim: { value: new THREE.Color(rim) },
      uRimPower: { value: rimPower },
      uOpacity: { value: opacity },
    }),
    // Seeded once; kept in sync through the material ref below so a prop
    // change never triggers a shader recompile.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFrame(() => {
    const u = material.current?.uniforms;
    if (!u) return;
    u.uOpacity.value = opacity;
    u.uRimPower.value = rimPower;
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
