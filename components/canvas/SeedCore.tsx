"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { NOISE } from "./glsl";
import { sceneState, stageFromScroll } from "./scene-state";

/**
 * The seed: a machined pod with something alive inside it.
 *
 * The shell is a displaced icosahedron shaded like anodised alloy — cold,
 * faceted, engineered. It breathes. Through the seams between its plates the
 * core shows through in lichen green, brighter on the inhale. A circuit lattice
 * holds it, and vines climb the outside.
 *
 * Normals are rebuilt from two tangent samples so the shading tracks the
 * deformation; without that the whole thing reads as a painted ball.
 */

const shellVert = /* glsl */ `
uniform float uTime;
uniform float uAmp;
uniform float uBreath;
uniform vec3 uPointer;

varying vec3 vNormal;
varying vec3 vView;
varying float vSeam;

${NOISE}

// Cheap on purpose: this runs three times per vertex to rebuild the normal.
float relief(vec3 p) {
  float body = fbm3(p * 1.9 + vec3(0.0, uTime * 0.1, 0.0));
  float veins = gnoise(p * 4.6 - vec3(uTime * 0.07, 0.0, 0.0));
  return body * 0.6 + veins * 0.26;
}

vec3 solve(vec3 dir) {
  return dir * (1.0 + relief(dir) * uAmp + uBreath);
}

void main() {
  vec3 dir = normalize(position);

  vec3 helper = abs(dir.y) > 0.95 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
  vec3 t1 = normalize(cross(dir, helper));
  vec3 t2 = cross(dir, t1);

  float eps = 0.045;
  float d0 = relief(dir);
  vec3 p0 = dir * (1.0 + d0 * uAmp + uBreath);
  vec3 p1 = solve(normalize(dir + t1 * eps));
  vec3 p2 = solve(normalize(dir + t2 * eps));

  // The pointer presses a slow swelling through the shell.
  float reach = smoothstep(1.2, 0.0,
    distance(dir, normalize(uPointer + vec3(0.0, 0.0, 1.0))));
  p0 += dir * reach * 0.14;

  vSeam = d0;
  vNormal = normalize(normalMatrix * normalize(cross(p1 - p0, p2 - p0)));

  vec4 mv = modelViewMatrix * vec4(p0, 1.0);
  vView = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

const shellFrag = /* glsl */ `
uniform vec3 uLichen;
uniform vec3 uJade;
uniform float uHeat;

varying vec3 vNormal;
varying vec3 vView;
varying float vSeam;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vView);
  vec3 R = reflect(-V, N);

  // Anodised alloy: cold, slightly green-grey, with one hard key light. The
  // tight specular lobe is what stops it reading as plastic.
  float up = R.y * 0.5 + 0.5;
  vec3 shell = mix(vec3(0.006, 0.014, 0.010), vec3(0.34, 0.44, 0.38),
                   smoothstep(0.52, 0.99, up));
  shell += vec3(0.26, 0.34, 0.30) * pow(1.0 - abs(R.y), 14.0) * 0.85;

  vec3 key = normalize(vec3(-0.42, 0.76, 0.5));
  shell += vec3(0.92, 1.0, 0.94) * pow(max(dot(R, key), 0.0), 260.0) * 3.4;
  shell += uJade * pow(max(dot(R, key), 0.0), 20.0) * 0.2;

  // Light from the core escaping through the seams between plates. Tight
  // threshold, so it reads as glowing cracks rather than a lit-up ball.
  float seam = smoothstep(-0.02, -0.30, vSeam);
  shell += uLichen * seam * 1.35 * uHeat;

  // Grazing angles bloom — the pod is lit from within, not from the room.
  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 4.0);
  shell += mix(uJade, uLichen, 0.4) * fresnel * 0.7 * uHeat;

  gl_FragColor = vec4(shell, 1.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export function SeedCore() {
  const group = useRef<THREE.Group>(null);
  const shell = useRef<THREE.ShaderMaterial>(null);
  const lattice = useRef<THREE.Mesh>(null);
  const detail = sceneState.quality === "high" ? 16 : 9;

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmp: { value: 0.26 },
      uBreath: { value: 0 },
      uHeat: { value: 1 },
      uPointer: { value: new THREE.Vector3() },
      uLichen: { value: new THREE.Color("#c3f53c") },
      uJade: { value: new THREE.Color("#1fd69b") },
    }),
    [],
  );

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05);
    const u = shell.current?.uniforms;
    if (!u || !group.current) return;

    u.uTime.value += d;
    u.uPointer.value.set(sceneState.smoothX, sceneState.smoothY, 0);

    // The breath. Everything alive on this page is on this one clock.
    const breath = Math.sin(u.uTime.value * 0.85) * 0.5 + 0.5;
    u.uBreath.value = breath * 0.055;

    const stage = Math.min(stageFromScroll(sceneState.scroll), 1);
    const compact = sceneState.compact;

    const scale = THREE.MathUtils.lerp(compact ? 0.55 : 1, 0.12, stage);
    group.current.visible = scale > 0.02;
    group.current.scale.setScalar(scale);
    group.current.position.set(
      0,
      (compact ? 2.7 : 0.4) - stage * 0.6,
      -stage * 2.8,
    );
    group.current.rotation.y += d * 0.1;
    group.current.rotation.x = Math.sin(u.uTime.value * 0.2) * 0.1;

    u.uHeat.value = THREE.MathUtils.lerp(1, 0.3, stage) * (0.75 + breath * 0.45);

    if (lattice.current) {
      lattice.current.rotation.y -= d * 0.06;
      lattice.current.rotation.z += d * 0.025;
    }
  });

  return (
    <group ref={group} position={[0, 0.4, 0]}>
      <mesh>
        <icosahedronGeometry args={[1.5, detail]} />
        <shaderMaterial
          ref={shell}
          vertexShader={shellVert}
          fragmentShader={shellFrag}
          uniforms={uniforms}
        />
      </mesh>

      {/* Circuit lattice holding the pod closed. */}
      <mesh ref={lattice} scale={1.36}>
        <icosahedronGeometry args={[1.5, 2]} />
        <meshBasicMaterial
          color="#2f6b46"
          wireframe
          transparent
          opacity={0.42}
          depthWrite={false}
        />
      </mesh>

      <Orbit radius={2.5} tilt={Math.PI / 2.5} speed={0.12} color="#c3f53c" />
      <Orbit radius={3.0} tilt={-Math.PI / 3.4} speed={-0.08} color="#1fd69b" />
    </group>
  );
}

function Orbit({
  radius,
  tilt,
  speed,
  color,
}: {
  radius: number;
  tilt: number;
  speed: number;
  color: string;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * speed;
  });

  return (
    <mesh ref={ref} rotation={[tilt, 0, 0]}>
      <torusGeometry args={[radius, 0.007, 6, 140]} />
      <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.8} />
    </mesh>
  );
}
