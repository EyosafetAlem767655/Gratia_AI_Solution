/**
 * Shared GLSL chunks.
 *
 * Deliberately hash-based gradient noise rather than simplex: it is a third of
 * the ALU cost, tiles well enough for organic surfaces, and every shader in the
 * scene can share one implementation.
 */

export const NOISE = /* glsl */ `
vec3 hash33(vec3 p) {
  p = vec3(
    dot(p, vec3(127.1, 311.7, 74.7)),
    dot(p, vec3(269.5, 183.3, 246.1)),
    dot(p, vec3(113.5, 271.9, 124.6))
  );
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float gnoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(
      mix(dot(hash33(i + vec3(0.0, 0.0, 0.0)), f - vec3(0.0, 0.0, 0.0)),
          dot(hash33(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0)), u.x),
      mix(dot(hash33(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0)),
          dot(hash33(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0)), u.x),
      u.y),
    mix(
      mix(dot(hash33(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0)),
          dot(hash33(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0)), u.x),
      mix(dot(hash33(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0)),
          dot(hash33(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0)), u.x),
      u.y),
    u.z);
}

float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * gnoise(p);
    p *= 2.03;
    amplitude *= 0.5;
  }
  return value;
}

// Three octaves. Used anywhere the shader runs per-vertex on dense geometry,
// where the fourth octave costs more than it shows.
float fbm3(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 3; i++) {
    value += amplitude * gnoise(p);
    p *= 2.03;
    amplitude *= 0.5;
  }
  return value;
}
`;

/**
 * A crude but convincing studio environment evaluated per-pixel: a bright
 * overhead softbox, a tight horizon band that gives metal its "waistline", and
 * a molten bounce from below. Costs nothing next to a real cubemap and keeps
 * the scene free of any external HDRI fetch.
 */
export const CHROME_ENV = /* glsl */ `
vec3 chromeEnv(vec3 R, vec3 molten) {
  float up = R.y * 0.5 + 0.5;

  // Overhead softbox falling off into the void.
  vec3 env = mix(vec3(0.010, 0.014, 0.022), vec3(0.58, 0.65, 0.75),
                 smoothstep(0.48, 0.99, up));

  // Specular horizon band — the giveaway that a surface is polished.
  env += vec3(0.42, 0.50, 0.62) * pow(1.0 - abs(R.y), 12.0) * 0.7;

  // A hard key light. Without a tight specular lobe metal reads as plastic,
  // and this is the single cheapest thing that sells the material.
  vec3 key = normalize(vec3(-0.45, 0.72, 0.53));
  env += vec3(1.0, 0.98, 0.94) * pow(max(dot(R, key), 0.0), 220.0) * 3.2;
  env += vec3(0.6, 0.68, 0.8) * pow(max(dot(R, key), 0.0), 18.0) * 0.35;

  // Molten bounce from the forge below — kept low so the metal stays metal.
  env += molten * pow(smoothstep(0.5, 0.0, up), 2.6) * 0.42;

  return env;
}
`;
