"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

/* ------------------------------------------------------------------ */
/* Rig — mutable handles the animation controller drives every frame.   */
/* ------------------------------------------------------------------ */

export interface CatRig {
  root: THREE.Group | null;
  body: THREE.Group | null;
  head: THREE.Group | null;
  earL: THREE.Group | null;
  earR: THREE.Group | null;
  lidL: THREE.Group | null;
  lidR: THREE.Group | null;
  tail: THREE.Group | null;
  tailSegments: THREE.Group[];
  shadow: THREE.Mesh | null;
}

export function createCatRig(): CatRig {
  return {
    root: null,
    body: null,
    head: null,
    earL: null,
    earR: null,
    lidL: null,
    lidR: null,
    tail: null,
    tailSegments: [],
    shadow: null,
  };
}

/* ------------------------------------------------------------------ */
/* Materials                                                           */
/* ------------------------------------------------------------------ */

const FUR = "#F3EBDC";
const FUR_WARM = "#EADFCB";
const INNER_EAR = "#D9A69F";
const NOSE = "#B87C74";
const IRIS = "#C98A2E";
const PUPIL = "#14161A";

/**
 * Procedural Persian cat.
 *
 * Built entirely from primitives so the site ships with zero binary assets
 * and stays fast. To swap in a real GLB later, replace the body of this
 * component with a <primitive object={gltf.scene} /> and keep the same rig
 * refs (bone names can be mapped in CatAnimationController) — no UI code
 * changes are required.
 */
export function CatModel({
  rig,
}: {
  rig: React.RefObject<CatRig>;
}) {
  const materials = useMemo(() => {
    const fur = new THREE.MeshStandardMaterial({ color: FUR, roughness: 0.94, metalness: 0 });
    const furWarm = new THREE.MeshStandardMaterial({
      color: FUR_WARM,
      roughness: 0.96,
      metalness: 0,
    });
    const innerEar = new THREE.MeshStandardMaterial({
      color: INNER_EAR,
      roughness: 0.85,
      metalness: 0,
    });
    const nose = new THREE.MeshStandardMaterial({ color: NOSE, roughness: 0.5, metalness: 0 });
    const iris = new THREE.MeshStandardMaterial({
      color: IRIS,
      roughness: 0.28,
      metalness: 0.05,
    });
    const pupil = new THREE.MeshStandardMaterial({ color: PUPIL, roughness: 0.35 });
    const glint = new THREE.MeshStandardMaterial({
      color: "#FFFFFF",
      emissive: new THREE.Color("#FFFFFF"),
      emissiveIntensity: 0.5,
      roughness: 0.2,
    });
    const whisker = new THREE.MeshStandardMaterial({
      color: "#B6A995",
      roughness: 0.7,
      transparent: true,
      opacity: 0.8,
    });
    return { fur, furWarm, innerEar, nose, iris, pupil, glint, whisker };
  }, []);

  /* Tail: a chain of nested groups so it can wave like a real tail. */
  const tail = useMemo(() => {
    const rootGroup = new THREE.Group();
    const segments: THREE.Group[] = [];
    let parent: THREE.Group = rootGroup;

    for (let i = 0; i < 7; i += 1) {
      const segment = new THREE.Group();
      segment.position.set(0, 0, i === 0 ? 0 : -0.105);

      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.07 + i * 0.007, 14, 10),
        materials.fur
      );
      mesh.position.z = -0.05;
      mesh.scale.set(1, 0.95, 1.5);
      segment.add(mesh);

      parent.add(segment);
      parent = segment;
      segments.push(segment);
    }

    rootGroup.userData.segments = segments as THREE.Group[];
    return { rootGroup, segments, materials };
  }, [materials]);

  useEffect(() => {
    rig.current.tail = tail.rootGroup;
    rig.current.tailSegments = tail.segments;
    return () => {
      tail.rootGroup.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
      });
    };
  }, [tail, rig]);

  useEffect(() => {
    const all = Object.values(materials);
    return () => all.forEach((m) => m.dispose());
  }, [materials]);

  const whiskers = useMemo(() => {
    const list: Array<{ position: [number, number, number]; rotation: [number, number, number]; length: number }> = [];
    for (const side of [-1, 1] as const) {
      for (let row = 0; row < 3; row += 1) {
        list.push({
          position: [side * 0.115, -0.055 + row * 0.035, 0.255],
          rotation: [0, side * 0.45, side * (1.25 - row * 0.22)],
          length: 0.42 - row * 0.03,
        });
      }
      // Brow whiskers
      list.push({
        position: [side * 0.12, 0.145, 0.22],
        rotation: [0, side * 0.35, side * 0.55],
        length: 0.2,
      });
    }
    return list;
  }, []);

  return (
    <group
      ref={(node) => {
        rig.current.root = node;
      }}
    >
      {/* Soft contact shadow */}
      <mesh
        ref={(node) => {
          rig.current.shadow = node;
        }}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.005, 0.02]}
      >
        <circleGeometry args={[0.62, 40]} />
        <meshBasicMaterial color="#102A43" transparent opacity={0.16} depthWrite={false} />
      </mesh>

      {/* Body — breathing happens on this group */}
      <group
        ref={(node) => {
          rig.current.body = node;
        }}
      >
        {/* Haunches */}
        <mesh material={materials.fur} position={[-0.29, 0.3, -0.04]} scale={[0.92, 1, 1.12]}>
          <sphereGeometry args={[0.3, 26, 20]} />
        </mesh>
        <mesh material={materials.fur} position={[0.29, 0.3, -0.04]} scale={[0.92, 1, 1.12]}>
          <sphereGeometry args={[0.3, 26, 20]} />
        </mesh>

        {/* Main torso */}
        <mesh material={materials.fur} position={[0, 0.44, -0.02]} scale={[1, 1.06, 0.94]}>
          <sphereGeometry args={[0.4, 30, 24]} />
        </mesh>

        {/* Chest ruff — the fluffy Persian front */}
        <mesh material={materials.furWarm} position={[0, 0.47, 0.2]} scale={[1.04, 1.02, 0.82]}>
          <sphereGeometry args={[0.32, 28, 22]} />
        </mesh>
        <mesh material={materials.furWarm} position={[0, 0.66, 0.16]} scale={[0.86, 0.78, 0.7]}>
          <sphereGeometry args={[0.24, 24, 18]} />
        </mesh>

        {/* Front legs + paws */}
        {[-1, 1].map((side) => (
          <group key={`leg-${side}`}>
            <mesh
              material={materials.fur}
              position={[side * 0.16, 0.24, 0.29]}
              rotation={[0.06, 0, side * -0.03]}
            >
              <capsuleGeometry args={[0.072, 0.26, 6, 14]} />
            </mesh>
            <mesh
              material={materials.fur}
              position={[side * 0.165, 0.06, 0.33]}
              scale={[1, 0.68, 1.4]}
            >
              <sphereGeometry args={[0.088, 18, 14]} />
            </mesh>
            {/* Hind paw peeking out */}
            <mesh
              material={materials.furWarm}
              position={[side * 0.3, 0.07, 0.14]}
              scale={[1, 0.62, 1.35]}
            >
              <sphereGeometry args={[0.095, 18, 14]} />
            </mesh>
          </group>
        ))}

        {/* Tail */}
        <primitive object={tail.rootGroup} position={[0.16, 0.24, -0.3]} rotation={[0.2, 0.5, 0.1]} />
      </group>

      {/* Head */}
      <group
        ref={(node) => {
          rig.current.head = node;
        }}
        position={[0, 0.92, 0.06]}
      >
        {/* Skull */}
        <mesh material={materials.fur} scale={[1.07, 0.99, 0.97]}>
          <sphereGeometry args={[0.33, 32, 26]} />
        </mesh>

        {/* Fluffy cheeks / ruff around the face */}
        <mesh material={materials.furWarm} position={[-0.19, -0.08, 0.14]} scale={[1, 0.92, 0.84]}>
          <sphereGeometry args={[0.165, 22, 18]} />
        </mesh>
        <mesh material={materials.furWarm} position={[0.19, -0.08, 0.14]} scale={[1, 0.92, 0.84]}>
          <sphereGeometry args={[0.165, 22, 18]} />
        </mesh>
        <mesh material={materials.furWarm} position={[0, -0.16, 0.1]} scale={[1.1, 0.8, 0.9]}>
          <sphereGeometry args={[0.17, 22, 18]} />
        </mesh>

        {/* Flat Persian muzzle */}
        <mesh material={materials.furWarm} position={[0, -0.07, 0.245]} scale={[1.15, 0.7, 0.72]}>
          <sphereGeometry args={[0.115, 20, 16]} />
        </mesh>
        <mesh material={materials.nose} position={[0, -0.015, 0.3]} scale={[1.3, 0.85, 0.7]}>
          <sphereGeometry args={[0.045, 16, 12]} />
        </mesh>
        {/* Mouth line */}
        <mesh material={materials.nose} position={[0, -0.075, 0.295]} scale={[1.4, 0.22, 0.4]}>
          <sphereGeometry args={[0.03, 12, 10]} />
        </mesh>

        {/* Eyes */}
        {([-1, 1] as const).map((side) => (
          <group key={`eye-${side}`} position={[side * 0.145, 0.045, 0.245]}>
            <mesh material={materials.iris} scale={[1, 1.05, 0.85]}>
              <sphereGeometry args={[0.083, 24, 20]} />
            </mesh>
            <mesh material={materials.pupil} position={[0, 0, 0.055]} scale={[0.72, 1.05, 0.5]}>
              <sphereGeometry args={[0.042, 18, 14]} />
            </mesh>
            <mesh material={materials.glint} position={[0.028, 0.032, 0.07]}>
              <sphereGeometry args={[0.017, 12, 10]} />
            </mesh>

            {/* Eyelid — rotation.x drives the blink */}
            <group
              ref={(node) => {
                if (side === -1) rig.current.lidL = node;
                else rig.current.lidR = node;
              }}
              rotation={[-1.45, 0, 0]}
            >
              <mesh material={materials.fur}>
                <sphereGeometry args={[0.094, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
              </mesh>
            </group>
          </group>
        ))}

        {/* Ears */}
        {([-1, 1] as const).map((side) => (
          <group
            key={`ear-${side}`}
            ref={(node) => {
              if (side === -1) rig.current.earL = node;
              else rig.current.earR = node;
            }}
            position={[side * 0.215, 0.245, -0.02]}
            rotation={[0.06, 0, side * 0.26]}
          >
            <mesh material={materials.fur} scale={[1, 1, 0.52]} rotation={[0, side * 0.12, 0]}>
              <coneGeometry args={[0.13, 0.25, 14]} />
            </mesh>
            <mesh
              material={materials.innerEar}
              position={[0, -0.01, 0.035]}
              scale={[0.72, 0.78, 0.5]}
            >
              <coneGeometry args={[0.13, 0.24, 14]} />
            </mesh>
          </group>
        ))}

        {/* Whiskers */}
        <group>
          {whiskers.map((w, index) => (
            <mesh
              key={`whisker-${index}`}
              material={materials.whisker}
              position={w.position}
              rotation={w.rotation}
            >
              <cylinderGeometry args={[0.0035, 0.002, w.length, 5]} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}
