"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { NOISE } from "./glsl";

/**
 * Inside-out sky sphere. Replaces the flat clear colour with slow fbm smoke —
 * cold graphite up top, a molten horizon low and behind — so the void has
 * depth even where nothing else is drawn.
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
uniform vec3 uMolten;

varying vec3 vDir;

${NOISE}

void main() {
  vec3 d = normalize(vDir);
  float h = d.y * 0.5 + 0.5;

  vec3 col = mix(vec3(0.010, 0.013, 0.020),
                 vec3(0.022, 0.028, 0.040),
                 smoothstep(0.0, 1.0, h));

  float smoke = fbm(d * 2.4 + vec3(0.0, uTime * 0.018, uTime * 0.01));
  smoke = smoothstep(0.02, 0.62, smoke);

  // Cold haze above, forge glow below.
  col += vec3(0.05, 0.068, 0.095) * smoke * 0.55 * smoothstep(0.25, 0.95, h);
  col += uMolten * smoke * 0.06 * smoothstep(0.72, 0.05, h);

  gl_FragColor = vec4(col, 1.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export function Backdrop() {
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMolten: { value: new THREE.Color("#ff9d2e") },
    }),
    [],
  );

  // Uniforms are reached through the material ref rather than the memoised
  // object: the frame loop must not mutate a value produced during render.
  useFrame((_, delta) => {
    const u = material.current?.uniforms;
    if (!u) return;
    u.uTime.value += Math.min(delta, 0.05);
  });

  return (
    <mesh frustumCulled={false} renderOrder={-1}>
      <sphereGeometry args={[70, 32, 24]} />
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
