"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sceneState } from "./scene-state";

/**
 * A flock, circling.
 *
 * One instanced draw call for the whole flock. The wingbeat happens entirely in
 * the vertex shader — each vertex lifts in proportion to how far it sits from
 * the spine, on a per-instance phase — so the CPU only ever writes a transform
 * per bird, and the birds still flap out of sync with each other the way real
 * ones do.
 *
 * Every bird also banks into its turn. That one detail is the difference
 * between a flock and a carousel of paper aeroplanes.
 */

const birdVert = /* glsl */ `
uniform float uTime;

attribute float aPhase;
attribute float aSpeed;

varying float vFold;

void main() {
  vec3 p = position;

  // Wingbeat: displacement scales with distance from the spine, so the wing
  // bends along its span instead of hinging rigidly.
  float span = abs(p.x);
  float beat = sin(uTime * (7.0 + aSpeed * 3.0) + aPhase);
  p.y += span * span * beat * 0.85;
  p.z -= span * 0.12 * (1.0 - beat * 0.3);

  vFold = beat * 0.5 + 0.5;

  vec4 mv = modelViewMatrix * instanceMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
}
`;

const birdFrag = /* glsl */ `
uniform vec3 uBody;
uniform vec3 uEdge;
uniform float uOpacity;

varying float vFold;

void main() {
  // Upstroke catches the canopy light, downstroke falls into shadow.
  vec3 col = mix(uBody, uEdge, vFold * 0.65);
  gl_FragColor = vec4(col, uOpacity);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/** Two swept wings and a slim body — enough silhouette to read as a bird. */
function birdGeometry() {
  const geometry = new THREE.BufferGeometry();

  // prettier-ignore
  const vertices = new Float32Array([
    // left wing
    0, 0, 0.14,   -0.5, 0, -0.16,   0, 0, -0.2,
    // right wing
    0, 0, 0.14,    0, 0, -0.2,      0.5, 0, -0.16,
    // body
    0, 0, 0.2,    -0.07, 0, -0.26,  0.07, 0, -0.26,
  ]);

  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return geometry;
}

type Bird = {
  radius: number;
  height: number;
  speed: number;
  offset: number;
  tilt: number;
};

export function Flock() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const count = sceneState.quality === "high" ? 22 : 12;

  const birds = useMemo<Bird[]>(() => {
    const out: Bird[] = [];
    for (let i = 0; i < count; i++) {
      // Deterministic scatter — the flock must look the same on every reload.
      const r = (n: number) => {
        const s = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
        return s - Math.floor(s);
      };
      out.push({
        radius: 9 + r(1) * 7,
        height: 3.4 + r(2) * 5.5,
        speed: 0.1 + r(3) * 0.09,
        offset: r(4) * Math.PI * 2,
        tilt: (r(5) - 0.5) * 0.5,
      });
    }
    return out;
  }, [count]);

  // Per-instance wingbeat phase and rate, uploaded once as instanced
  // attributes so the flap costs the CPU nothing per frame.
  const geometry = useMemo(() => {
    const g = birdGeometry();
    const phase = new Float32Array(count);
    const speed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      phase[i] = birds[i].offset * 3.1;
      speed[i] = birds[i].speed * 6;
    }
    g.setAttribute("aPhase", new THREE.InstancedBufferAttribute(phase, 1));
    g.setAttribute("aSpeed", new THREE.InstancedBufferAttribute(speed, 1));
    return g;
  }, [birds, count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const instanced = mesh.current;
    const u = material.current?.uniforms;
    if (!instanced || !u) return;

    const t = state.clock.elapsedTime;
    u.uTime.value = t;

    // The flock crosses the sky through the first half of the story, then
    // climbs out of frame as the camera enters the grove.
    const presence = 1 - Math.min(1, Math.max(0, (sceneState.scroll - 0.42) * 3));
    u.uOpacity.value = presence;
    instanced.visible = presence > 0.02;
    if (presence <= 0.02) return;

    for (let i = 0; i < birds.length; i++) {
      const b = birds[i];
      const angle = t * b.speed + b.offset;

      dummy.position.set(
        Math.cos(angle) * b.radius,
        b.height + Math.sin(t * 0.4 + b.offset) * 0.7 + (1 - presence) * 12,
        Math.sin(angle) * b.radius - 4,
      );

      // Face along the tangent of the circle, then bank into the turn.
      dummy.rotation.set(0, -angle + Math.PI / 2, b.tilt);
      dummy.scale.setScalar(0.8 + b.speed);
      dummy.updateMatrix();
      instanced.setMatrixAt(i, dummy.matrix);
    }

    instanced.instanceMatrix.needsUpdate = true;
  });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uBody: { value: new THREE.Color("#1b3626") },
      uEdge: { value: new THREE.Color("#89b98f") },
    }),
    [],
  );

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, undefined, count]}
      frustumCulled={false}
      // Off until the first frame writes real transforms — otherwise the whole
      // flock is drawn stacked at the origin for one frame.
      visible={false}
    >
      <shaderMaterial
        ref={material}
        vertexShader={birdVert}
        fragmentShader={birdFrag}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </instancedMesh>
  );
}
