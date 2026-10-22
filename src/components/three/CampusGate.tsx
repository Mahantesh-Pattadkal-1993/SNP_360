"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { GRASS, GRASS_DARK } from "./palette";

type Mode = "day" | "night";

/**
 * The south campus entrance gate, from "gate to south campus.jpeg".
 *
 * The photo shows a classical cream portico: a heavy entablature with a
 * fluted-pilaster frieze, a coffered soffit under it, round Tuscan columns
 * carrying it, a panelled wall between the columns, and black wrought-iron
 * sliding gates. A curled-arm lamp post stands to the left of the opening.
 *
 * On the master plan (spot **01**) this gate is drawn TWICE, side by side:
 * an **ENTRY** lane and an **EXIT** lane separated by a small planted island.
 * `CampusGate` therefore models one gate; `SouthCampusGate` places the pair.
 */

const CREAM = "#e6dfc9";
const CREAM_DARK = "#cfc6ab";
const IRON = "#1d1d1f";
const STONE = "#b9b1a0";

/** Fluted Tuscan column with a simple capital and base. */
function Column({ position, height, radius = 0.34 }: { position: [number, number, number]; height: number; radius?: number }) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[radius * 0.88, radius, height, 16]} />
        <meshStandardMaterial color={CREAM} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[radius * 1.18, radius * 1.28, 0.24, 16]} />
        <meshStandardMaterial color={CREAM_DARK} roughness={0.9} />
      </mesh>
      <mesh position={[0, height + 0.11, 0]} castShadow>
        <cylinderGeometry args={[radius * 1.2, radius * 0.92, 0.22, 16]} />
        <meshStandardMaterial color={CREAM} roughness={0.85} />
      </mesh>
      <mesh position={[0, height + 0.3, 0]} castShadow>
        <boxGeometry args={[radius * 2.7, 0.18, radius * 2.7]} />
        <meshStandardMaterial color={CREAM} roughness={0.85} />
      </mesh>
    </group>
  );
}

/** Black wrought-iron gate leaf: vertical bars with top and bottom rails. */
function GateLeaf({ width, height }: { width: number; height: number }) {
  const bars = Math.max(6, Math.round(width / 0.16));
  return (
    <group>
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[width, 0.1, 0.08]} />
        <meshStandardMaterial color={IRON} roughness={0.5} metalness={0.6} />
      </mesh>
      <mesh position={[0, height - 0.06, 0]}>
        <boxGeometry args={[width, 0.1, 0.08]} />
        <meshStandardMaterial color={IRON} roughness={0.5} metalness={0.6} />
      </mesh>
      {Array.from({ length: bars }, (_, i) => (
        <mesh key={i} position={[-width / 2 + (i * width) / (bars - 1), height / 2, 0]}>
          <boxGeometry args={[0.045, height, 0.045]} />
          <meshStandardMaterial color={IRON} roughness={0.5} metalness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, height * 0.55, 0]}>
        <boxGeometry args={[width, 0.05, 0.05]} />
        <meshStandardMaterial color={IRON} roughness={0.5} metalness={0.6} />
      </mesh>
    </group>
  );
}

/**
 * One entrance gate: a portico spanning the opening, carried on two columns,
 * with iron gates below. `rotation` turns it to face the approach road.
 */
export function CampusGate({
  position,
  rotation = 0,
  mode,
  width = 5.2,
  lampSide = -1,
}: {
  position: [number, number, number];
  rotation?: number;
  mode: Mode;
  /** Clear width of the opening between the columns — one traffic lane. */
  width?: number;
  /** Which side the lamp post stands on, relative to the gate's own axes. */
  lampSide?: 1 | -1;
}) {
  const light = mode === "night";
  const colH = 5.2;
  const entH = 1.5;
  const pierW = 0.9;

  // coffered soffit: a row of recessed panels under the entablature
  const coffers = useMemo(
    () => Array.from({ length: 3 }, (_, i) => [-width * 0.28 + i * width * 0.28] as [number]),
    [width],
  );

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* flanking piers (the panelled wall the columns are set against) */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * (width / 2 + pierW / 2), 2.6, 0]} castShadow receiveShadow>
            <boxGeometry args={[pierW, 5.2, 1.1]} />
            <meshStandardMaterial color={CREAM} roughness={0.9} />
          </mesh>
          <mesh position={[s * (width / 2 + pierW / 2), 5.35, 0]} castShadow>
            <boxGeometry args={[pierW + 0.24, 0.3, 1.3]} />
            <meshStandardMaterial color={CREAM_DARK} roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* columns */}
      {[-1, 1].map((s) => (
        <Column key={s} position={[s * (width / 2), 0, 0.35]} height={colH} />
      ))}

      {/* entablature: architrave + frieze + cornice */}
      <mesh position={[0, colH + 0.75, 0.2]} castShadow>
        <boxGeometry args={[width + pierW * 2 + 0.6, 0.5, 1.7]} />
        <meshStandardMaterial color={CREAM} roughness={0.85} />
      </mesh>
      <mesh position={[0, colH + 1.45, 0.2]} castShadow>
        <boxGeometry args={[width + pierW * 2 + 0.6, entH, 1.5]} />
        <meshStandardMaterial color={CREAM} roughness={0.85} />
      </mesh>
      {/* fluted pilaster strips across the frieze */}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh
          key={i}
          position={[-((width + pierW * 2) / 2) + 0.9 + i * ((width + pierW * 2 - 1.8) / 8), colH + 1.45, 0.96]}
          castShadow
        >
          <boxGeometry args={[0.16, entH * 0.72, 0.07]} />
          <meshStandardMaterial color={CREAM_DARK} roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, colH + 2.32, 0.25]} castShadow>
        <boxGeometry args={[width + pierW * 2 + 0.9, 0.28, 1.8]} />
        <meshStandardMaterial color={CREAM} roughness={0.85} />
      </mesh>
      <mesh position={[0, colH + 2.56, 0.3]} castShadow>
        <boxGeometry args={[width + pierW * 2 + 1.2, 0.2, 2]} />
        <meshStandardMaterial color={CREAM_DARK} roughness={0.9} />
      </mesh>

      {/* coffered soffit under the portico */}
      <mesh position={[0, colH + 0.44, -0.2]} receiveShadow>
        <boxGeometry args={[width + pierW * 2, 0.12, 1.3]} />
        <meshStandardMaterial color={CREAM_DARK} roughness={0.95} />
      </mesh>
      {coffers.map(([cx], i) => (
        <mesh key={i} position={[cx, colH + 0.36, -0.2]} receiveShadow>
          <boxGeometry args={[width * 0.2, 0.08, 0.9]} />
          <meshStandardMaterial color={CREAM} roughness={0.95} />
        </mesh>
      ))}

      {/* wrought-iron gates, slightly open, as in the photo */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * width * 0.26, 0, -0.35]}>
          <GateLeaf width={width * 0.48} height={2.9} />
        </group>
      ))}

      {/* threshold step */}
      <mesh position={[0, 0.06, -0.3]} receiveShadow>
        <boxGeometry args={[width + 0.4, 0.12, 1.6]} />
        <meshStandardMaterial color={STONE} roughness={0.95} />
      </mesh>

      {/* curled-arm lamp post, as beside the opening in the photo */}
      <group position={[lampSide * (width / 2 + pierW + 0.5), 0, 0.9]}>
        <mesh position={[0, 1.9, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.1, 3.8, 8]} />
          <meshStandardMaterial color={IRON} roughness={0.6} />
        </mesh>
        <mesh position={[lampSide * 0.3, 3.85, 0]} rotation={[0, 0, (lampSide * -Math.PI) / 2]} castShadow>
          <torusGeometry args={[0.3, 0.045, 6, 14, Math.PI * 0.85]} />
          <meshStandardMaterial color={IRON} roughness={0.6} />
        </mesh>
        <mesh position={[lampSide * 0.56, 3.66, 0]} castShadow>
          <boxGeometry args={[0.28, 0.36, 0.28]} />
          <meshStandardMaterial
            color={light ? "#ffd27a" : "#3a3a3a"}
            emissive={light ? "#ffb84d" : "#000000"}
            emissiveIntensity={light ? 2 : 0}
          />
        </mesh>
        {light && <pointLight position={[lampSide * 0.56, 3.4, 0]} intensity={8} distance={14} color="#ffc27a" />}
      </group>
    </group>
  );
}

/**
 * Spot 01 on the master plan: the south campus entrance, drawn as an ENTRY
 * and an EXIT gate side by side with a small planted island between them.
 * Both gates share the same design; the photo shows one of them.
 */
export function SouthCampusGate({
  position,
  rotation = 0,
  mode,
}: {
  position: [number, number];
  rotation?: number;
  mode: Mode;
}) {
  // The two lanes run north-south through the gate, so the pair sits SIDE BY SIDE across
  // the driveway with a planted island between them. The driveway is ~15 m between kerbs:
  // two 5.2 m openings plus their piers, with ~1.6 m of island in the middle.
  const gap = 6.8;
  const width = 5.2;
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, rotation, 0]}>
      {/* entry lane (east) and exit lane (west), each a portico of the same design */}
      <CampusGate position={[gap / 2, 0, 0]} rotation={0} mode={mode} width={width} lampSide={1} />
      <CampusGate position={[-gap / 2, 0, 0]} rotation={Math.PI} mode={mode} width={width} lampSide={1} />
      {/* planted island between the two lanes */}
      <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[(gap - width) / 2, 24]} />
        <meshStandardMaterial color={GRASS} roughness={1} />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <coneGeometry args={[(gap - width) / 4.5, 0.9, 8]} />
        <meshStandardMaterial color={GRASS_DARK} roughness={0.95} />
      </mesh>
    </group>
  );
}

