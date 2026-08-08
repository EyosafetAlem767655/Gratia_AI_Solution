/**
 * Scene state lives outside React on purpose.
 *
 * Scroll and pointer change on every frame; routing them through state would
 * re-render the whole tree 60×/second. The DOM writes into this object, the
 * render loop reads from it, and React never learns anything happened.
 */

export type Quality = "fallback" | "balanced" | "high";
export type SceneChapter = "awaken" | "connect" | "build" | "prove" | "evolve";

export const sceneState = {
  /** Page scroll, 0 → 1. */
  scroll: 0,
  /** Signed scroll delta, decayed each frame — drives motion smear. */
  velocity: 0,
  /** Pointer in NDC, -1 → 1. */
  pointerX: 0,
  pointerY: 0,
  /** Damped pointer, so nothing snaps. */
  smoothX: 0,
  smoothY: 0,
  /** Render budget, decided once from the device's capabilities. */
  quality: "high" as Quality,
  /** False while the browser tab is hidden, allowing animation work to pause. */
  visible: true,
  /** Narrow viewport: the copy column spans the whole screen, so the scene has
   *  to move out of its way rather than sit behind it. */
  compact: false,
};

/** Scroll positions where the scene settles into each narrative beat.
 *  These are tuned against where the DOM sections actually land, so the
 *  vortex has formed by the time Contact fills the viewport. */
export const STAGE_ANCHORS = [0.02, 0.23, 0.46, 0.7, 0.9] as const;
export const SCENE_CHAPTERS: readonly SceneChapter[] = ["awaken", "connect", "build", "prove", "evolve"];

export function smootherstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/**
 * Continuous 0 → 3 "stage" value. Every scene element reads this instead of raw
 * scroll, so the whole composition stays choreographed to the same beats.
 */
export function stageFromScroll(scroll: number): number {
  if (scroll <= STAGE_ANCHORS[0]) return 0;
  for (let i = 0; i < STAGE_ANCHORS.length - 1; i++) {
    const a = STAGE_ANCHORS[i];
    const b = STAGE_ANCHORS[i + 1];
    if (scroll <= b) return i + smootherstep((scroll - a) / (b - a));
  }
  return STAGE_ANCHORS.length - 1;
}

export function chapterFromScroll(scroll: number): SceneChapter {
  return SCENE_CHAPTERS[Math.round(stageFromScroll(scroll))] ?? "evolve";
}

/** 0 → 1 ramp across an arbitrary scroll window. */
export function window01(scroll: number, start: number, end: number): number {
  return smootherstep((scroll - start) / (end - start));
}

/** 1 while inside the window, ramping in and out at the edges. */
export function band(
  scroll: number,
  start: number,
  end: number,
  feather = 0.06,
): number {
  return (
    window01(scroll, start - feather, start + feather) *
    (1 - window01(scroll, end - feather, end + feather))
  );
}
