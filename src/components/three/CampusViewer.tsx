"use client";

import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Wing } from "@/data/wings";
import { CampusScene } from "./CampusScene";

interface CampusViewerProps {
  mode: "day" | "night";
  onSelectWing?: (wing: Wing) => void;
  highlightedWingId?: string;
  className?: string;
}

export function CampusViewer({ mode, onSelectWing, highlightedWingId, className }: CampusViewerProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={className ?? "relative h-[75vh] w-full overflow-hidden rounded-2xl"}>
      <Canvas
        shadows
        camera={{ position: [180, 280, 360], fov: 50, far: 2500 }}
        onCreated={() => setLoaded(true)}
        gl={{ preserveDrawingBuffer: true }}
      >
        <Suspense fallback={null}>
          <CampusScene mode={mode} onSelectWing={(wing) => onSelectWing?.(wing)} highlightedWingId={highlightedWingId} />
        </Suspense>
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={40}
          maxDistance={900}
          maxPolarAngle={Math.PI / 2 - 0.02}
          target={[-30, 10, 0]}
        />
      </Canvas>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-900/80 text-sm text-white">
          Loading 3D walkthrough…
        </div>
      )}
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1.5 text-xs text-white">
        Drag to orbit · scroll to zoom · click a wing for details
      </div>
    </div>
  );
}
