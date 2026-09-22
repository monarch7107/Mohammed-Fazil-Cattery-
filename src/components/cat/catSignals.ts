"use client";

/**
 * Shared, mutation-only signals between the DOM layer and the 3D scene.
 *
 * These are deliberately NOT React state: pointer data updates at 60fps and
 * must never trigger a re-render. The animation controller reads them inside
 * useFrame().
 */

export type CatMood = "relaxed" | "curious" | "attentive" | "calm";
export type CatQuality = "high" | "low";

export interface CatSignals {
  /** Viewport-normalised pointer, -1..1 (0,0 = centre). */
  pointerX: number;
  pointerY: number;
  /** True when the cursor is close to the companion. */
  pointerNear: boolean;
  /** Which website section the cat is currently "watching". */
  mood: CatMood;
  quality: CatQuality;
  reducedMotion: boolean;
  /** Bumped to trigger a reaction (click / tap). */
  requestReact: number;
  /** True when something modal is open or the route hides the cat. */
  paused: boolean;
  /** True while the opening experience is on screen. */
  introActive: boolean;
}

export const catSignals: CatSignals = {
  pointerX: 0,
  pointerY: 0,
  pointerNear: false,
  mood: "relaxed",
  quality: "high",
  reducedMotion: false,
  requestReact: 0,
  paused: false,
  introActive: false,
};

export function triggerCatReact() {
  catSignals.requestReact = Date.now();
}

/** Mood → behaviour tuning read by the animation controller. */
export const moodProfile: Record<
  CatMood,
  { gain: number; tail: number; tilt: number; lift: number; blinkEvery: [number, number] }
> = {
  relaxed: { gain: 0.32, tail: 0.85, tilt: 0.04, lift: 0, blinkEvery: [3.2, 6.5] },
  curious: { gain: 0.75, tail: 1.4, tilt: 0.1, lift: -0.04, blinkEvery: [2.6, 5] },
  attentive: { gain: 0.95, tail: 1.1, tilt: 0.02, lift: -0.07, blinkEvery: [3, 5.6] },
  calm: { gain: 0.2, tail: 0.6, tilt: 0.06, lift: 0.02, blinkEvery: [4, 7.5] },
};
