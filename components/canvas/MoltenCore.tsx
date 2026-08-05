"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CHROME_ENV, NOISE } from "./glsl";
import { sceneState, stageFromScroll } from "./scene-state";

/**
 * The hero centrepiece: a ball of liquid chrome being worked by an unseen
 * forge. The surface is displaced by fbm in the vertex stage, normals are
 * rebuilt from two tangent samples so highlights actually track the
 * deformation, and heat pools in the valleys where the metal runs thinnest.
 */

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uAmp;
uniform float uSwell;
uniform vec3 uPointer;

varying vec3 vNormal;
varying vec3 vView;
varying float vDisp;

${NOISE}

// Three octaves of body plus one of fine ridging. Kept deliberately cheap:
// this runs three times per vertex to rebuild the normal.
float relief(vec3 p) {
  float body = fbm3(p * 2.1 + vec3(0.0, uTime * 0.16, uTime * 0.05));
  float ridge = gnoise(p * 5.2 - vec3(uTime * 0.11, 0.0, 0.0));
  return body * 0.62 + ridge * 0.22;
}

vec3 solve(vec3 dir) {
  return dir * (1.0 + relief(dir) * uAmp + uSwell);
}

void main() {
  vec3 dir = normalize(position);

  // Rebuild the normal by displacing two tangent-plane neighbours. Without
  // this the lighting stays perfectly spherical and the effect dies.
  vec3 helper = abs(dir.y) > 0.95 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
  vec3 t1 = normalize(cross(dir, helper));
  vec3 t2 = cross(dir, t1);

  float eps = 0.04;
  float d0 = relief(dir);
  vec3 p0 = dir * (1.0 + d0 * uAmp + uSwell);
  vec3 p1 = solve(normalize(dir + t1 * eps));
  vec3 p2 = solve(normalize(dir + t2 * eps));

  // The pointer pushes a slow bulge through the metal.
  float reach = smoothstep(1.2, 0.0,
    distance(dir, normalize(uPointer + vec3(0.0, 0.0, 1.0))));
  p0 += dir * reach * 0.17;

  vDisp = d0;
  vNormal = normalize(normalMatrix * normalize(cross(p1 - p0, p2 - p0)));

  vec4 mv = modelViewMatrix * vec4(p0, 1.0);
  vView = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uMolten;
uniform float uHeat;

varying vec3 vNormal;
varying vec3 vView;
varying float vDisp;

${CHROME_ENV}

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vView);
  vec3 R = reflect(-V, N);

  vec3 col = chromeEnv(R, uMolten);

  // Grazing angles glow — the rim is where the metal runs hottest.
  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.8);
  col += uMolten * fresnel * 0.85 * uHeat;

  // Molten pooling in the troughs of the displacement. Tight threshold, so it
  // reads as seams of heat in the metal rather than a glowing ball.
  col += uMolten * smoothstep(0.02, -0.30, vDisp) * 0.38 * uHeat;

  gl_FragColor = vec4(col, 1.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export function MoltenCore() {
  const group = useRef<THREE.Group>(null);
  const cage = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const detail = sceneState.quality === "high" ? 24 : 12;

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmp: { value: 0.23 },
      uSwell: { value: 0 },
      uHeat: { value: 1 },
      uPointer: { value: new THREE.Vector3() },
      uMolten: { value: new THREE.Color("#ff9d2e") },
    }),
    [],
  );

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05);
    const u = material.current?.uniforms;
    if (!u) return;

    u.uTime.value += d;
    u.uPointer.value.set(sceneState.smoothX, sceneState.smoothY, 0);

    // Scroll velocity swells the metal, as if the forge just took a beat.
    u.uSwell.value = THREE.MathUtils.damp(
      u.uSwell.value,
      Math.min(Math.abs(sceneState.velocity) * 2.2, 0.14),
      6,
      d,
    );

    if (!group.current) return;
    const stage = Math.min(stageFromScroll(sceneState.scroll), 1);

    // Recedes and cools as the story moves past the hero. On narrow screens it
    // also sits smaller and higher, clear of the full-width copy column.
    const compact = sceneState.compact;
    const scale = THREE.MathUtils.lerp(compact ? 0.72 : 1, 0.14, stage);
    const restY = compact ? 1.7 : 0.35;
    group.current.visible = scale > 0.02;
    group.current.scale.setScalar(scale);
    group.current.position.set(0, restY - stage * 0.55, -stage * 2.6);
    group.current.rotation.y += d * 0.12;
    group.current.rotation.x = Math.sin(u.uTime.value * 0.22) * 0.12;

    u.uHeat.value = THREE.MathUtils.lerp(1, 0.35, stage);

    if (cage.current) {
      cage.current.rotation.y -= d * 0.07;
      cage.current.rotation.z += d * 0.03;
    }
  });

  return (
    <group ref={group} position={[0, 0.35, 0]}>
      <mesh>
        <icosahedronGeometry args={[1.55, detail]} />
        <shaderMaterial
          ref={material}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
        />
      </mesh>

      {/* Containment cage — a cold chrome lattice holding the melt. */}
      <mesh ref={cage} scale={1.4}>
        <icosahedronGeometry args={[1.55, 1]} />
        <meshBasicMaterial
          color="#4d5c6e"
          wireframe
          transparent
          opacity={0.26}
          depthWrite={false}
        />
      </mesh>

      {/* Crossed rings — instrumentation around the core. */}
      <Ring radius={2.55} tilt={Math.PI / 2.4} speed={0.14} />
      <Ring radius={3.1} tilt={-Math.PI / 3.6} speed={-0.09} />
    </group>
  );
}

function Ring({
  radius,
  tilt,
  speed,
}: {
  radius: number;
  tilt: number;
  speed: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * speed;
  });

  return (
    <mesh ref={ref} rotation={[tilt, 0, 0]}>
      <torusGeometry args={[radius, 0.006, 6, 160]} />
      <meshBasicMaterial color="#ffb257" toneMapped={false} />
    </mesh>
  );
}
