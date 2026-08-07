"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Forest canopy dome.
 *
 * Deliberately arithmetic — no fbm. The previous sky ran four octaves of noise
 * per fragment across the whole viewport, which is roughly forty million hash
 * evaluations a frame and was the single largest cause of scroll stutter. This
 * gets the same depth from a gradient, two soft light shafts and a mist band,
 * for a handful of ALU ops.
 */

const vertexShader = /* glsl */ `
varying vec3 vDir;

void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uDeep;
uniform vec3 uCanopy;
uniform vec3 uLichen;

varying vec3 vDir;

void main() {
  vec3 d = normalize(vDir);
  float h = d.y * 0.5 + 0.5;

  // Forest floor dark below, faint canopy light above.
  vec3 col = mix(uDeep, uCanopy, smoothstep(0.32, 0.96, h));

  // Two broad shafts of light coming down through the leaves, drifting.
  float a = atan(d.z, d.x);
  float shaft = pow(max(sin(a * 1.5 + uTime * 0.06), 0.0), 6.0)
              + pow(max(sin(a * 2.5 - uTime * 0.04 + 2.1), 0.0), 8.0) * 0.6;
  col += uLichen * shaft * 0.05 * smoothstep(0.15, 0.9, h);

  // Ground mist gathering at the horizon.
  col += uCanopy * pow(1.0 - abs(d.y), 14.0) * 0.5;

  gl_FragColor = vec4(col, 1.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export function Sky() {
  const material = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color("#020705") },
      uCanopy: { value: new THREE.Color("#0a2418") },
      uLichen: { value: new THREE.Color("#c3f53c") },
    }),
    [],
  );

  useFrame((_, delta) => {
    const u = material.current?.uniforms;
    if (u) u.uTime.value += Math.min(delta, 0.05);
  });

  return (
    <mesh frustumCulled={false} renderOrder={-1}>
      <sphereGeometry args={[80, 24, 16]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}
