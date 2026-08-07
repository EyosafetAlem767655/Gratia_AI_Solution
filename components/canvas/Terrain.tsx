"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { NOISE } from "./glsl";
import { sceneState } from "./scene-state";

/**
 * Mossy ground with a survey grid growing through it.
 *
 * The displacement is real geometry (one fbm per vertex on a modest grid, not
 * per pixel), and the contour lines are derivative-based so they stay a pixel
 * wide at any distance. Read together they say the same thing the brand does:
 * something measured laid over something living.
 */

const vertexShader = /* glsl */ `
uniform float uTime;

varying vec3 vWorld;
varying float vHeight;

${NOISE}

void main() {
  vec3 p = position;

  // Rolling ground. Two scales: landform, then surface texture.
  float land = fbm3(vec3(p.x * 0.045, p.y * 0.045, 0.0)) * 3.4;
  float bumps = gnoise(vec3(p.x * 0.3, p.y * 0.3, uTime * 0.03)) * 0.22;
  p.z += land + bumps;

  vec4 world = modelMatrix * vec4(p, 1.0);
  vWorld = world.xyz;
  vHeight = land;

  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const fragmentShader = /* glsl */ `
uniform float uTime;
uniform float uOpacity;
uniform vec3 uMoss;
uniform vec3 uLichen;

varying vec3 vWorld;
varying float vHeight;

float gridLine(vec2 p, float scale, float weight) {
  vec2 c = p * scale;
  vec2 g = abs(fract(c - 0.5) - 0.5) / max(fwidth(c), 1e-5);
  return 1.0 - min(min(g.x, g.y) * weight, 1.0);
}

void main() {
  vec2 p = vWorld.xz;
  float dist = length(p);

  float fine = gridLine(p, 0.5, 1.0);
  float coarse = gridLine(p, 0.1, 1.3);
  float fade = smoothstep(46.0, 3.0, dist);

  // Moss thickens in the hollows, thins on the ridges.
  vec3 col = uMoss * (0.55 + vHeight * 0.22);

  // Survey lines, and a slow pulse of sap running outward through them.
  col += uLichen * (fine * 0.07 + coarse * 0.2);
  float pulse = pow(max(sin(dist * 0.5 - uTime * 0.9), 0.0), 26.0);
  col += uLichen * pulse * 0.16 * smoothstep(26.0, 2.0, dist);

  // Glow pooling under the seed.
  col += uLichen * 0.1 * smoothstep(10.0, 0.0, dist);

  float alpha = (0.2 + fine * 0.26 + coarse * 0.46 + pulse * 0.3) * fade;
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0) * uOpacity);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export function Terrain() {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const segments = sceneState.quality === "high" ? 110 : 56;

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uMoss: { value: new THREE.Color("#162b1e") },
      uLichen: { value: new THREE.Color("#c3f53c") },
    }),
    [],
  );

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05);
    const u = material.current?.uniforms;
    if (!u) return;

    u.uTime.value += d;
    u.uOpacity.value = THREE.MathUtils.damp(u.uOpacity.value, 1, 1.4, d);

    // Drops away as the camera enters the grove corridor, so the ground never
    // slices through the trees.
    if (mesh.current) {
      const target = -3.1 - Math.max(0, sceneState.scroll - 0.52) * 20;
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
      position={[0, -3.1, 0]}
      frustumCulled={false}
    >
      <planeGeometry args={[130, 130, segments, segments]} />
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
