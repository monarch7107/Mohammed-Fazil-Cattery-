"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { catSignals, type CatQuality } from "./catSignals";
import { CatInteractionController, useCatTap } from "./CatInteractionController";
import { CatErrorBoundary, CatFallback } from "./CatFallback";

const CatScene = dynamic(() => import("./CatScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-end justify-center opacity-70">
      <CatFallback className="animate-pulse" />
    </div>
  ),
});

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") ?? canvas.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

function detectQuality(): CatQuality {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const memory = nav.deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  const smallViewport = Math.min(window.innerWidth, window.innerHeight) < 480;
  return memory <= 2 || cores <= 2 || (smallViewport && cores <= 4) ? "low" : "high";
}

/**
 * The persistent floating companion.
 *
 * Desktop: bottom-right, clear of the WhatsApp button.
 * Mobile:  small, bottom-left, clear of the sticky contact bar.
 *
 * Entirely decorative (aria-hidden) — the website is fully usable without it.
 */
export function CatCompanion({ visible = true }: { visible?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState<{ webgl: boolean; quality: CatQuality; reduced: boolean } | null>(
    null
  );

  useCatTap(containerRef);

  useEffect(() => {
    if (!visible) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const webgl = supportsWebGL();
    const quality = detectQuality();
    catSignals.reducedMotion = reduced;
    catSignals.quality = quality;

    type IdleHandle = number;
    const schedule: (cb: () => void) => IdleHandle =
      typeof window.requestIdleCallback === "function"
        ? (cb) => window.requestIdleCallback(() => cb(), { timeout: 1500 })
        : (cb) => window.setTimeout(cb, 300);

    const handle = schedule(() => setScene({ webgl, quality, reduced }));

    return () => {
      if (typeof window.cancelIdleCallback === "function" && typeof handle === "number") {
        window.cancelIdleCallback(handle);
      } else {
        window.clearTimeout(handle);
      }
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed bottom-24 left-3 z-40 h-24 w-24 sm:bottom-24 sm:left-auto sm:right-6 sm:h-36 sm:w-36 lg:h-44 lg:w-44"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 600ms ease" }}
    >
      <div
        className="group pointer-events-auto relative h-full w-full"
        style={{ touchAction: "pan-y" }}
      >
        <div className="absolute inset-0 transition-transform duration-500 ease-editorial group-hover:-translate-y-1">
          {scene === null ? (
            <div className="flex h-full w-full items-end justify-center opacity-60">
              <CatFallback className="animate-pulse" />
            </div>
          ) : scene.webgl ? (
            <CatErrorBoundary fallback={<CatFallback />}>
              <CatScene reduced={scene.reduced} quality={scene.quality} />
            </CatErrorBoundary>
          ) : (
            <CatFallback />
          )}
        </div>
        <span className="pointer-events-none absolute -top-1 right-0 hidden h-2 w-2 rounded-full bg-green/0 transition-colors duration-300 group-hover:bg-green lg:block" />
      </div>
      <CatInteractionController containerRef={containerRef} />
    </div>
  );
}
