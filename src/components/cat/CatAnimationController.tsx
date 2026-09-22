"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { catSignals, moodProfile } from "./catSignals";
import type { CatRig } from "./CatModel";

/**
 * Animation state machine + per-frame procedural animation.
 *
 * States: IDLE · BLINK · LOOK · EAR_TWITCH · TAIL_MOVEMENT · REACT ·
 *         WALK · RUN · RETURN
 *
 * Idle behaviour is deliberately sparse and randomised: breathing, an
 * occasional blink, rare ear twitches, a lazy tail wave and soft head
 * tracking. Clicking/tapping escalates to REACT → RUN → (vanish) → RETURN.
 */

type Phase = "IDLE" | "REACT" | "RUN" | "WAIT" | "RETURN" | "WALK";

const OPEN_LID = -1.45;
const CLOSED_LID = 1.62;
const EASE = { inOut: (x: number) => x * x * (3 - 2 * x) };

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const damp = THREE.MathUtils.damp;

function setGroupOpacity(root: THREE.Object3D | null, value: number) {
  if (!root) return;
  const opacity = clamp(value, 0, 1);
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (!material) return;
    const list = Array.isArray(material) ? material : [material];
    for (const m of list) {
      const standard = m as THREE.MeshStandardMaterial;
      standard.transparent = true;
      standard.opacity = opacity;
      standard.depthWrite = opacity > 0.97;
    }
  });
}

export function CatAnimationController({
  rig,
  reduced = false,
}: {
  rig: React.RefObject<CatRig>;
  reduced?: boolean;
}) {
  const s = useRef({
    phase: "IDLE" as Phase,
    phaseT: 0,
    blinkT: -1,
    nextBlink: 1.4 + Math.random() * 2.6,
    pendingDoubleBlink: false,
    earT: -1,
    nextEar: 3 + Math.random() * 5,
    nextWalk: 10 + Math.random() * 8,
    lastReact: catSignals.requestReact,
    runDirection: 1,
    startY: 0,
    perk: 0,
    opacity: 1,
    yaw: 0,
    pitch: 0,
    roll: 0,
    tailPhase: 0,
  });

  useFrame((state, delta) => {
    const root = rig.current.root;
    const body = rig.current.body;
    const head = rig.current.head;
    if (!root || !body || !head) return;

    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const st = s.current;

    if (reduced) {
      // Static, dignified pose — one settle, then no further motion.
      head.rotation.set(0, 0, 0);
      body.scale.set(1, 1, 1);
      if (rig.current.lidL) rig.current.lidL.rotation.x = OPEN_LID;
      if (rig.current.lidR) rig.current.lidR.rotation.x = OPEN_LID;
      setGroupOpacity(root, 1);
      return;
    }

    const profile = moodProfile[catSignals.mood] ?? moodProfile.relaxed;

    /* ---------------- breathing ---------------- */
    const breath = Math.sin(t * 1.65);
    body.scale.y = 1 + breath * 0.017;
    body.scale.x = 1 - breath * 0.009;
    body.scale.z = 1 - breath * 0.006;
    root.position.y = st.startY + Math.sin(t * 0.8) * 0.008;

    /* ---------------- phase machine ---------------- */
    st.phaseT += dt;

    const nearReact = catSignals.requestReact;
    if (nearReact !== st.lastReact && !catSignals.paused) {
      st.lastReact = nearReact;
      st.phase = "REACT";
      st.phaseT = 0;
      st.runDirection = catSignals.pointerX >= 0 ? 1 : -1;
    }

    switch (st.phase) {
      case "REACT": {
        // Ears flick back, head lifts, a small startled pop.
        const k = Math.sin(Math.min(st.phaseT / 0.5, 1) * Math.PI);
        root.scale.setScalar(1 + k * 0.05);
        root.position.y = st.startY + k * 0.05;
        st.opacity = 1;
        if (st.phaseT >= 0.5) {
          st.phase = "RUN";
          st.phaseT = 0;
          root.scale.setScalar(1);
        }
        break;
      }
      case "RUN": {
        const k = clamp(st.phaseT / 0.85, 0, 1);
        root.position.x = st.runDirection * EASE.inOut(k) * 1.15;
        root.position.y = st.startY + Math.abs(Math.sin(k * Math.PI * 4)) * 0.05 * (1 - k);
        st.opacity = 1 - clamp((k - 0.45) / 0.55, 0, 1);
        if (st.phaseT >= 0.85) {
          st.phase = "WAIT";
          st.phaseT = 0;
          st.opacity = 0;
          root.position.x = st.runDirection * 1.3;
        }
        break;
      }
      case "WAIT": {
        st.opacity = 0;
        root.position.x = st.runDirection * 1.3;
        if (st.phaseT >= 0.5) {
          st.phase = "RETURN";
          st.phaseT = 0;
        }
        break;
      }
      case "RETURN": {
        const k = clamp(st.phaseT / 0.8, 0, 1);
        const eased = EASE.inOut(k);
        root.position.x = st.runDirection * 1.3 * (1 - eased);
        root.position.y = st.startY + Math.abs(Math.sin(k * Math.PI * 3)) * 0.035;
        st.opacity = clamp(k * 1.8, 0, 1);
        if (st.phaseT >= 0.8) {
          st.phase = "IDLE";
          st.phaseT = 0;
          root.position.x = 0;
          st.opacity = 1;
        }
        break;
      }
      case "WALK": {
        // A tiny, occasional shuffle — never enough to feel restless.
        const k = clamp(st.phaseT / 1.4, 0, 1);
        const sway = Math.sin(k * Math.PI * 2) * 0.045;
        root.position.x = sway;
        root.position.y = st.startY + Math.abs(Math.sin(k * Math.PI * 6)) * 0.014;
        if (st.phaseT >= 1.4) {
          st.phase = "IDLE";
          st.phaseT = 0;
          root.position.x = 0;
        }
        break;
      }
      default: {
        if (st.phase === "IDLE") {
          root.position.x = damp(root.position.x, 0, 6, dt);
          st.opacity = damp(st.opacity, 1, 8, dt);
          if (t > st.nextWalk && !catSignals.paused) {
            st.phase = "WALK";
            st.phaseT = 0;
            st.nextWalk = t + 12 + Math.random() * 9;
          }
        }
      }
    }

    setGroupOpacity(root, st.phase === "IDLE" || st.phase === "WALK" ? 1 : st.opacity);

    /* ---------------- head tracking (LOOK) ---------------- */
    const trackingActive = st.phase === "IDLE" || st.phase === "WALK";
    const gain = profile.gain * (catSignals.pointerNear ? 1.35 : 1);
    const wanderYaw = Math.sin(t * 0.37) * 0.09 + Math.sin(t * 0.11) * 0.05;
    const wanderPitch = Math.sin(t * 0.29) * 0.045;

    const targetYaw = trackingActive
      ? clamp(catSignals.pointerX * 0.6 * gain + wanderYaw, -0.75, 0.75)
      : st.yaw;
    const targetPitch = trackingActive
      ? clamp(catSignals.pointerY * -0.42 * gain + wanderPitch + profile.lift, -0.4, 0.4)
      : st.pitch;

    st.yaw = damp(st.yaw, targetYaw, 3.4, dt);
    st.pitch = damp(st.pitch, targetPitch, 3.4, dt);
    st.roll = damp(st.roll, profile.tilt * Math.sin(t * 0.23) * 2, 2, dt);

    const reactLift = st.phase === "REACT" ? -0.18 : 0;
    head.rotation.y = st.yaw;
    head.rotation.x = st.pitch + reactLift;
    head.rotation.z = st.roll;

    /* ---------------- blink (BLINK) ---------------- */
    const [blinkMin, blinkMax] = profile.blinkEvery;
    if (st.blinkT < 0 && t > st.nextBlink) {
      st.blinkT = 0;
      st.pendingDoubleBlink = Math.random() < 0.28;
    }

    let lidAngle = OPEN_LID;
    if (st.blinkT >= 0) {
      st.blinkT += dt;
      const closeT = 0.085;
      const openT = 0.16;
      if (st.blinkT < closeT) {
        lidAngle = OPEN_LID + (CLOSED_LID - OPEN_LID) * EASE.inOut(st.blinkT / closeT);
      } else if (st.blinkT < closeT + openT) {
        const k = (st.blinkT - closeT) / openT;
        lidAngle = CLOSED_LID - (CLOSED_LID - OPEN_LID) * EASE.inOut(k);
      } else {
        const double = st.pendingDoubleBlink;
        st.blinkT = -1;
        st.pendingDoubleBlink = false;
        st.nextBlink = double
          ? t + 0.34
          : t + blinkMin + Math.random() * (blinkMax - blinkMin);
      }
    }

    if (rig.current.lidL) rig.current.lidL.rotation.x = lidAngle;
    if (rig.current.lidR) rig.current.lidR.rotation.x = lidAngle;

    /* ---------------- ears (EAR_TWITCH) ---------------- */
    const wantPerk = catSignals.pointerNear || catSignals.mood === "curious" ? 1 : 0;
    st.perk = damp(st.perk, wantPerk, 3, dt);

    if (st.earT < 0 && t > st.nextEar) {
      st.earT = 0;
      st.nextEar = t + 3.5 + Math.random() * 6;
    }

    let earJolt = 0;
    if (st.earT >= 0) {
      st.earT += dt;
      const k = Math.sin(clamp(st.earT / 0.34, 0, 1) * Math.PI);
      earJolt = k * (st.phase === "REACT" ? 0.5 : 0.22);
      if (st.earT >= 0.34) st.earT = -1;
    }

    const reactEars = st.phase === "REACT" ? 0.34 : 0;
    if (rig.current.earL) {
      rig.current.earL.rotation.z = 0.26 + earJolt + reactEars;
      rig.current.earL.rotation.x = 0.06 - st.perk * 0.16 + earJolt * 0.4;
    }
    if (rig.current.earR) {
      rig.current.earR.rotation.z = -0.26 - earJolt - reactEars;
      rig.current.earR.rotation.x = 0.06 - st.perk * 0.16 + earJolt * 0.4;
    }

    /* ---------------- tail (TAIL_MOVEMENT) ---------------- */
    const segments = rig.current.tailSegments;
    if (segments.length) {
      const energy = profile.tail * (st.phase === "REACT" || st.phase === "RUN" ? 1.8 : 1);
      for (let i = 0; i < segments.length; i += 1) {
        const seg = segments[i];
        const phase = i * 0.55;
        seg.rotation.y = Math.sin(t * 1.35 + phase) * 0.1 * energy + (st.phase === "RUN" ? 0.16 : 0);
        seg.rotation.x = Math.sin(t * 0.85 + phase) * 0.045 * energy;
      }
    }

    /* ---------------- shadow follows the cat ---------------- */
    if (rig.current.shadow) {
      const material = rig.current.shadow.material as THREE.MeshBasicMaterial;
      material.opacity = 0.16 * (st.phase === "RUN" || st.phase === "WAIT" ? st.opacity : 1);
    }
  });

  return null;
}
