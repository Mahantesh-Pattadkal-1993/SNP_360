"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Sky, Stars } from "@react-three/drei";
import { wings, CDP_ROAD, PLAN_SCALE, type Wing } from "@/data/wings";
import { Building, CourtyardLawn, Pool } from "./Building";
import { Walkway } from "./Walkway";
import { Wing18Model } from "./Wing18Model";

interface CampusSceneProps {
  mode: "day" | "night";
  onSelectWing: (wing: Wing) => void;
  highlightedWingId?: string;
}

// Site features traced from Complete-Master-Plan-Sobha-Neopolis.webp, same pixel→metre mapping as
// the wings (origin px 360,400; PLAN_SCALE m/px). Plan is "not to scale" — proportional, not surveyed.
const p = (px: number, py: number): [number, number] => [(px - 360) * PLAN_SCALE, (py - 400) * PLAN_SCALE];
const rect = (x0: number, y0: number, x1: number, y1: number) => {
  const [ax, az] = p(x0, y0);
  const [bx, bz] = p(x1, y1);
  return { center: [(ax + bx) / 2, (az + bz) / 2] as [number, number], size: [bx - ax, bz - az] as [number, number] };
};

const NORTH_PLOT = rect(120, 30, 600, 275);
const SOUTH_PLOT_WEST = rect(100, 400, 230, 760);
const SOUTH_PLOT_EAST = rect(130, 435, 400, 780);
const WEST_ROAD = rect(70, 0, 100, 760); // 18 m CDP road along the west boundary
const LAKE: [number, number][] = [p(520, 300), p(880, 300), p(740, 630), p(585, 605)];

const LAWN_SPOTS: { position: [number, number]; size: number }[] = [
  { position: p(430, 150), size: 9 }, // Olympus Plaza roundabout
  { position: p(295, 670), size: 14 }, // Celebration Lawn, South Campus courtyard
  { position: p(370, 155), size: 10 },
  { position: p(250, 520), size: 10 },
];
const POOL_SPOTS: [number, number][] = [
  p(265, 415), // Leisure Pool by Club Syros
  p(665, 205), // Meandering Pool, clubhouse
];

function Ground({ center, size, color, y }: { center: [number, number]; size: [number, number]; color: string; y: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[center[0], y, center[1]]} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  );
}

function Lake({ mode }: { mode: "day" | "night" }) {
  const geometry = useMemo(() => {
    // shape lives in the X/Y plane; rotating -90° about X maps shape y → world -z
    const shape = new THREE.Shape(LAKE.map(([x, z]) => new THREE.Vector2(x, -z)));
    return new THREE.ShapeGeometry(shape);
  }, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]} geometry={geometry} receiveShadow>
      <meshStandardMaterial color={mode === "day" ? "#6fa8d6" : "#0e1a33"} metalness={0.2} roughness={0.15} />
    </mesh>
  );
}

export function CampusScene({ mode, onSelectWing, highlightedWingId }: CampusSceneProps) {
  const walkways = useMemo(
    () =>
      wings
        .filter((w) => w.connectors?.length)
        .flatMap((w) =>
          w.connectors!
            .filter((c) => c.wingNumber > w.number)
            .map((c) => {
              const target = wings.find((t) => t.number === c.wingNumber);
              return target ? { from: w.position, to: target.position } : null;
            }),
        )
        .filter((v): v is { from: [number, number]; to: [number, number] } => v !== null),
    [],
  );

  return (
    <>
      {mode === "day" ? (
        <>
          <Sky sunPosition={[80, 40, -40]} turbidity={4} rayleigh={1.5} />
          <hemisphereLight intensity={0.6} groundColor="#4f8f52" />
          <directionalLight position={[80, 90, -40]} intensity={1.6} castShadow shadow-mapSize={[2048, 2048]} />
        </>
      ) : (
        <>
          <color attach="background" args={["#060712"]} />
          <Stars radius={300} depth={60} count={4000} factor={3} fade speed={0.5} />
          <hemisphereLight intensity={0.15} groundColor="#0a0d1a" />
          <directionalLight position={[40, 90, -20]} intensity={0.25} />
          <ambientLight intensity={0.12} />
        </>
      )}

      {/* surrounding land */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[40, 0, 0]} receiveShadow>
        <planeGeometry args={[700, 600]} />
        <meshStandardMaterial color={mode === "day" ? "#d8d2c0" : "#11131f"} roughness={1} />
      </mesh>

      {/* campus plots */}
      {[NORTH_PLOT, SOUTH_PLOT_WEST, SOUTH_PLOT_EAST].map((plot, i) => (
        <Ground key={i} center={plot.center} size={plot.size} y={0.03} color={mode === "day" ? "#9fbf7a" : "#16201a"} />
      ))}

      {/* 18 m CDP road between the North Campus and the South Campus / lake, and along the west edge */}
      <Ground center={[40, CDP_ROAD.z]} size={[600, CDP_ROAD.width]} y={0.05} color={mode === "day" ? "#8e8e8a" : "#2a2a2e"} />
      <Ground center={[40, CDP_ROAD.z]} size={[600, 0.3]} y={0.06} color="#f2f2f2" />
      <Ground center={WEST_ROAD.center} size={WEST_ROAD.size} y={0.05} color={mode === "day" ? "#8e8e8a" : "#2a2a2e"} />

      <Lake mode={mode} />

      {LAWN_SPOTS.map((spot, i) => (
        <CourtyardLawn key={`lawn-${i}`} position={spot.position} size={spot.size} />
      ))}
      {POOL_SPOTS.map((spot, i) => (
        <Pool key={`pool-${i}`} position={spot} size={14} />
      ))}
      {walkways.map((w, i) => (
        <Walkway key={`walkway-${i}`} from={w.from} to={w.to} />
      ))}

      {wings.map((wing) => (
        wing.detailedModel ? (
          <Wing18Model
            key={wing.id}
            wing={wing}
            mode={mode}
            showLabel
            highlighted={wing.id === highlightedWingId}
            onSelect={onSelectWing}
          />
        ) : (
          <Building key={wing.id} wing={wing} mode={mode} highlighted={wing.id === highlightedWingId} onSelect={onSelectWing} />
        )
      ))}
    </>
  );
}
