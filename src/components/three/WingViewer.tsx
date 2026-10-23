"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { Wing } from "@/data/wings";
import type { FlatRef } from "@/data/flats";
import { Building } from "./Building";
import { Wing17Model, wing17FlatPlacement, type FlatPlacement } from "./Wing17Model";
import { Wing18Model, wing18FlatPlacement } from "./Wing18Model";
import { FLOOR_OUT_DAY, FLOOR_OUT_NIGHT } from "./palette";

interface WingViewerProps {
  wing: Wing;
  mode: "day" | "night";
  /** Flat to highlight on the facade. */
  flat?: FlatRef;
  /** Increment to fly the camera to stand just outside `flat`; 0 = overview. */
  flyToken?: number;
  className?: string;
}

interface CameraGoal {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

/** Eases the camera + orbit target toward `goal`; stops once close so the user can orbit freely again. */
function CameraRig({ goal }: { goal: CameraGoal | null }) {
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const camera = useThree((s) => s.camera);
  const active = useRef<CameraGoal | null>(null);

  useEffect(() => {
    active.current = goal;
  }, [goal]);

  useFrame((_, delta) => {
    const g = active.current;
    if (!g || !controls) return;
    const t = 1 - Math.exp(-delta * 3);
    camera.position.lerp(g.position, t);
    controls.target.lerp(g.target, t);
    controls.update();
    if (camera.position.distanceTo(g.position) < 0.05 && controls.target.distanceTo(g.target) < 0.05) {
      active.current = null;
    }
  });
  return null;
}

/** Close-up single-building viewer, orbit-only, centered on one wing regardless of its site position. */
export function WingViewer({ wing, mode, flat, flyToken = 0, className }: WingViewerProps) {
  const [loaded, setLoaded] = useState(false);
  const height = wing.floors * 3.2;
  const [x, z] = wing.position;
  const overview: CameraGoal = {
    position: new THREE.Vector3(x + 90, height * 0.75, z + 95),
    target: new THREE.Vector3(x, height * 0.5, z),
  };

  const isWing16or17 = wing.number === 16 || wing.number === 17;
  const placement: FlatPlacement | undefined = flat && wing.detailedModel
    ? (isWing16or17
        ? wing17FlatPlacement(flat.floor, flat.series.series, wing.number)
        : wing18FlatPlacement(flat.floor, flat.series.tower, flat.series.face) as FlatPlacement)
    : undefined;

  const [goal, setGoal] = useState<CameraGoal | null>(null);
  useEffect(() => {
    if (flyToken === 0) return;
    if (flyToken < 0 || !placement) {
      setGoal(overview);
      return;
    }
    // stand ~14 m out from the flat's facade, slightly off-axis, at its floor level
    const [cx, cy, cz] = placement.center;
    if (placement.axis === "x") {
      // end-block flat: approach along x from the outside
      const outward = cx < 0 ? 1 : -1;
      const target = new THREE.Vector3(x + cx, cy, z + cz);
      setGoal({ target, position: new THREE.Vector3(x + cx + outward * 14, cy + 1.2, z + cz + 5) });
    } else {
      const target = new THREE.Vector3(x + cx, cy, z + cz);
      setGoal({ target, position: new THREE.Vector3(x + cx * 1.4, cy + 1.2, z + cz + placement.normal * 14) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyToken]);

  return (
    <div className={className ?? "relative h-[70vh] w-full overflow-hidden rounded-2xl"}>
      <Canvas
        shadows
        camera={{ position: overview.position.toArray(), fov: 45 }}
        gl={{ preserveDrawingBuffer: true }}
        onCreated={() => setLoaded(true)}
      >
        <Suspense fallback={null}>
          {mode === "day" ? (
            <>
              <color attach="background" args={["#bfe3f5"]} />
              <hemisphereLight intensity={0.7} groundColor="#b9bab6" />
              <directionalLight position={[x + 60, height + 60, z + 60]} intensity={1.6} castShadow />
              <directionalLight position={[x - 40, height + 40, z - 80]} intensity={0.7} />
            </>
          ) : (
            <>
              <color attach="background" args={["#060712"]} />
              <hemisphereLight intensity={0.15} groundColor="#0a0d1a" />
              <directionalLight position={[x + 40, height + 60, z - 20]} intensity={0.25} />
              <ambientLight intensity={0.12} />
            </>
          )}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0, z]} receiveShadow>
            <planeGeometry args={[160, 160]} />
            <meshStandardMaterial color={mode === "day" ? FLOOR_OUT_DAY : FLOOR_OUT_NIGHT} roughness={1} />
          </mesh>
          {wing.detailedModel && (wing.number === 16 || wing.number === 17) ? (
            <Wing17Model wing={wing} mode={mode} highlightFlat={flat && placement ? { code: flat.code, placement } : undefined} />
          ) : wing.detailedModel ? (
            <Wing18Model wing={wing} mode={mode} highlightFlat={flat && placement ? { code: flat.code, placement } : undefined} />
          ) : (
            <Building wing={wing} mode={mode} />
          )}
        </Suspense>
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={3}
          maxDistance={220}
          maxPolarAngle={Math.PI / 2 - 0.02}
          target={overview.target.toArray()}
        />
        <CameraRig goal={goal} />
      </Canvas>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-900/80 text-sm text-white">
          Loading…
        </div>
      )}
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1.5 text-xs text-white">
        Drag to orbit · scroll to zoom
      </div>
    </div>
  );
}
