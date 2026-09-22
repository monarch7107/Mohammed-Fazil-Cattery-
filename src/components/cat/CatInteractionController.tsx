"use client";

import { useEffect, type RefObject } from "react";
import { catSignals, triggerCatReact } from "./catSignals";

/**
 * DOM ↔ 3D bridge.
 *
 * - Tracks the pointer (viewport-normalised) so the cat can look at it.
 * - Detects proximity to the companion (ears perk, tracking gain rises).
 * - Turns clicks and taps into reactions without re-rendering React.
 *
 * Mounted once, in CatCompanion. Uses only passive listeners.
 */
export function CatInteractionController({
  containerRef,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
}) {
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      catSignals.pointerX = (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      catSignals.pointerY = -((event.clientY / Math.max(window.innerHeight, 1)) * 2 - 1);

      const el = containerRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distance = Math.hypot(event.clientX - centerX, event.clientY - centerY);
        catSignals.pointerNear = distance < Math.max(rect.width, 150) * 1.4;
      }
    };

    const onLeave = () => {
      catSignals.pointerNear = false;
      catSignals.pointerX = 0;
      catSignals.pointerY = 0;
    };

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => {
      catSignals.reducedMotion = motionQuery.matches;
    };
    syncMotion();

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    motionQuery.addEventListener("change", syncMotion);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      motionQuery.removeEventListener("change", syncMotion);
    };
  }, [containerRef]);

  return null;
}

/**
 * Tap/click handling for the companion surface.
 * A tap that travels more than 12px is treated as a scroll and ignored, so
 * the cat never steals a swipe gesture on mobile.
 */
export function useCatTap(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;
    let startAt = 0;

    const onDown = (event: PointerEvent) => {
      startX = event.clientX;
      startY = event.clientY;
      startAt = Date.now();
    };

    const onUp = (event: PointerEvent) => {
      const moved = Math.hypot(event.clientX - startX, event.clientY - startY);
      const elapsed = Date.now() - startAt;
      if (moved > 12 || elapsed > 600 || catSignals.paused) return;
      triggerCatReact();
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);

    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
    };
  }, [ref]);
}
