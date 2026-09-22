"use client";

import { useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { CatModel, createCatRig, type CatRig } from "./CatModel";
import { CatAnimationController } from "./CatAnimationController";
import type { CatQuality } from "./catSignals";

function CameraAim() {
  const camera = useThree((state) => state.camera);
  useEffect(() => {
    camera.lookAt(0, 0.52, 0);
  }, [camera]);
  return null;
}

/**
 * The WebGL scene. Dynamically imported — it never blocks first paint and
 * never runs on the server.
 */
export default function CatScene({
  reduced = false,
  quality = "high",
}: {
  reduced?: boolean;
  quality?: CatQuality;
}) {
  const rig = useRef<CatRig>(createCatRig());
  const dpr: [number, number] = quality === "low" ? [1, 1.35] : [1, 2];

  return (
    <Canvas
      dpr={dpr}
      frameloop={reduced ? "demand" : "always"}
      camera={{ position: [0, 0.74, 2.5], fov: 30 }}
      gl={{
        antialias: quality !== "low",
        alpha: true,
        powerPreference: "high-performance",
      }}
      style={{ pointerEvents: "none", width: "100%", height: "100%" }}
      onCreated={({ gl }) => {
        gl.setClearAlpha(0);
      }}
    >
      <CameraAim />
      <hemisphereLight args={["#FFF6E8", "#7A451E", 0.85]} />
      <ambientLight intensity={0.32} />
      <directionalLight position={[2.4, 3.4, 2.8]} intensity={1.45} color="#FFF3E2" />
      <directionalLight position={[-3, 1.8, -1.6]} intensity={0.45} color="#CFE0F0" />
      <directionalLight position={[0, -1.2, 2]} intensity={0.2} color="#F8F3EA" />
      <CatModel rig={rig} />
      <CatAnimationController rig={rig} reduced={reduced} />
    </Canvas>
  );
}
