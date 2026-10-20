"use client";

import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Wing } from "@/data/wings";
import { compassLabel, DEFAULT_SUN_SLOT_HOUR, SUN_REFERENCE_DATE, SUN_SLOTS } from "@/data/sun";
import { CampusScene } from "./CampusScene";

interface CampusViewerProps {
  mode: "day" | "night";
  onSelectWing?: (wing: Wing) => void;
  highlightedWingId?: string;
  className?: string;
}


/** Compass rose: N/E/S/W fixed to the scene, sun dot at its current azimuth. */
function SunCompass({ azimuth, altitude }: { azimuth: number; altitude: number }) {
  const r = 26;
  const rad = (azimuth * Math.PI) / 180;
  const above = altitude > 0;
  return (
    <svg viewBox="-36 -36 72 72" className="h-16 w-16" aria-hidden>
      <circle r={r} fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.5)" />
      {[
        ["N", 0, -r - 5],
        ["E", r + 5, 0],
        ["S", 0, r + 5],
        ["W", -r - 5, 0],
      ].map(([label, x, y]) => (
        <text key={label as string} x={x} y={y} fontSize="8" fill="white" textAnchor="middle" dominantBaseline="middle">
          {label}
        </text>
      ))}
      <line x1={0} y1={0} x2={Math.sin(rad) * r} y2={-Math.cos(rad) * r} stroke="#fbbf24" strokeWidth={1.5} />
      <circle cx={Math.sin(rad) * r} cy={-Math.cos(rad) * r} r={4} fill={above ? "#fbbf24" : "#6b7280"} />
    </svg>
  );
}

export function CampusViewer({ mode, onSelectWing, highlightedWingId, className }: CampusViewerProps) {
  const [loaded, setLoaded] = useState(false);
  const [slotHour, setSlotHour] = useState(DEFAULT_SUN_SLOT_HOUR);
  const slot = SUN_SLOTS.find((candidate) => candidate.hour === slotHour) ?? SUN_SLOTS[1];
  const sun = slot.sun;
  const day = mode === "day";
  const referenceDate = SUN_REFERENCE_DATE.toLocaleDateString("en-IN", { day: "numeric", month: "long" });
  const sunCaption = slot.clamped
    ? `Sunrise — sun rising in the ${compassLabel(sun.azimuth)}; shown just above the horizon (actually ${Math.abs(slot.trueAltitude).toFixed(0)}° below at 6 AM)`
    : `Sun ${sun.altitude.toFixed(0)}° high in the ${compassLabel(sun.azimuth)} (${sun.azimuth.toFixed(0)}°)`;

  return (
    <div className={className ?? "relative h-[75vh] w-full overflow-hidden rounded-2xl"}>
      <Canvas
        shadows
        camera={{ position: [180, 280, 360], fov: 50, far: 2500 }}
        onCreated={() => setLoaded(true)}
        gl={{ preserveDrawingBuffer: true }}
      >
        <Suspense fallback={null}>
          <CampusScene
            mode={mode}
            sun={day ? sun : undefined}
            onSelectWing={(wing) => onSelectWing?.(wing)}
            highlightedWingId={highlightedWingId}
          />
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

      {day && (
        <div className="absolute left-3 right-3 top-3 flex flex-wrap items-center gap-4 rounded-xl bg-black/55 px-4 py-3 text-white backdrop-blur sm:right-auto sm:w-[30rem]">
          <SunCompass azimuth={sun.azimuth} altitude={sun.altitude} />
          <div className="min-w-0 flex-1">
            <p id="sun-slot-label" className="text-sm font-semibold">
              Time of day · {slot.label}
            </p>
            <div role="radiogroup" aria-labelledby="sun-slot-label" className="mt-2 flex gap-1">
              {SUN_SLOTS.map((candidate) => {
                const active = candidate.hour === slotHour;
                return (
                  <button
                    key={candidate.hour}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSlotHour(candidate.hour)}
                    className={`flex-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                      active ? "bg-amber-400 text-stone-900" : "bg-white/15 text-white hover:bg-white/25"
                    }`}
                  >
                    {candidate.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-white/85">{sunCaption}</p>
            <p className="mt-0.5 text-[10px] text-white/65">Sun positions shown for {referenceDate} (equinox), IST.</p>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1.5 text-xs text-white">
        Drag to orbit · scroll to zoom · click a wing for details
      </div>
    </div>
  );
}
