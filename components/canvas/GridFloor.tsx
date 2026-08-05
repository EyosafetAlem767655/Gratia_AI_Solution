"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sceneState } from "./scene-state";

/**
 * The foundry floor: an analytically anti-aliased grid that fades into the
 * void, with pressure rings pulsing outward from under the core.
 *
 * Derivative-based line width means the grid stays exactly one pixel thick at
 * every distance — no moiré, no shimmer, and none of the cost of the mirror
 * floor this replaces.
 */

const vertexShader = /* glsl */ `
varying vec3 vWorld;

void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const fragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uChrome;
uniform vec3 uMolten;
uniform float uOpacity;

varying vec3 vWorld;

// Screen-space-consistent grid lines via derivatives.
float gridLine(vec2 p, float scale, float weight) {
  vec2 c = p * scale;
  vec2 g = abs(fract(c - 0.5) - 0.5) / max(fwidth(c), 1e-5);
  return 1.0 - min(min(g.x, g.y) * weight, 1.0);
}

void main() {
  vec2 p = vWorld.xz;
  float dist = length(p);

  float fine = gridLine(p, 1.0, 1.0);
  float coarse = gridLine(p, 0.2, 1.35);

  float fade = smoothstep(38.0, 2.5, dist);

  // Pressure rings travelling out from the forge.
  float ring = pow(max(sin(dist * 0.85 - uTime * 1.25), 0.0), 24.0);
  ring *= smoothstep(30.0, 1.0, dist);

  vec3 col = uChrome * (fine * 0.14 + coarse * 0.3);
  col += uMolten * ring * 0.55;
  col += uMolten * 0.1 * smoothstep(9.0, 0.0, dist);

  float alpha = (fine * 0.42 + coarse * 0.7 + ring * 0.8) * fade;
  alpha += smoothstep(7.5, 0.0, dist) * 0.09 * fade;

  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0) * uOpacity);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export function GridFloor() {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uChrome: { value: new THREE.Color("#9fb2c6") },
      uMolten: { value: new THREE.Color("#ff9d2e") },
    }),
    [],
  );

  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05);
    const u = material.current?.uniforms;
    if (!u) return;

    u.uTime.value += d;
    u.uOpacity.value = THREE.MathUtils.damp(u.uOpacity.value, 1, 1.4, d);

    // Sinks away as the camera dives into the tunnel, so the floor never
    // slices through the corridor.
    if (mesh.current) {
      const target = -2.3 - Math.max(0, sceneState.scroll - 0.5) * 18;
      mesh.current.position.y = THREE.MathUtils.damp(
        mesh.current.position.y,
        target,
        4,
        d,
      );
    }
  });

  return (
    <mesh
      ref={mesh}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -2.3, 0]}
      frustumCulled={false}
    >
      <planeGeometry args={[110, 110]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
