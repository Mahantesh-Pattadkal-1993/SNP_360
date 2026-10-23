"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Sky, Stars } from "@react-three/drei";
import { wings, CDP_ROAD, PLAN_SCALE, type Wing } from "@/data/wings";
import type { SunPosition } from "@/data/sun";
import { Building, CourtyardLawn, Pool } from "./Building";
import { Walkway } from "./Walkway";
import { Wing17Model } from "./Wing17Model";
import { Wing18Model } from "./Wing18Model";
import { SeatingArea, WalkingTrack, BasketballCourt } from "./Amenities";
import { SouthCampusGate } from "./CampusGate";
import { FLOOR_DAY, FLOOR_NIGHT, FLOOR_OUT_DAY, FLOOR_OUT_NIGHT, GRASS, GRASS_NIGHT } from "./palette";

// Site features traced from Complete-Master-Plan-Sobha-Neopolis.webp, same pixel→metre mapping as
// the wings (origin px 360,400; PLAN_SCALE m/px). Plan is "not to scale" — proportional, not surveyed.
const p = (px: number, py: number): [number, number] => [(px - 360) * PLAN_SCALE, (py - 400) * PLAN_SCALE];
const rect = (x0: number, y0: number, x1: number, y1: number) => {
  const [ax, az] = p(x0, y0);
  const [bx, bz] = p(x1, y1);
  return { center: [(ax + bx) / 2, (az + bz) / 2] as [number, number], size: [bx - ax, bz - az] as [number, number] };
};

// The ground the campus sits on. It is deliberately a neutral light GREY rather than green:
// a green floor swallows every green landscape element (lawns, lawn beds, planting), so
// grass and shrubs would be impossible to pick out. On this neutral floor the green
// landscape reads clearly as grass cover sitting on top of the paving.
// See palette.ts for the shared colours.

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

// The strip of landscape behind the Wing 18 / Wing 19 pair (the north side of the
// South Campus row), read off the master plan badges 26, 23 and 12:
//   26 – seating area, directly behind Wing 19
//   23 – curvy walking track, directly behind Wing 18
//   12 – basketball court, at the east end of the row
//
// The plan's row is drawn at ~22° to the axes, so the badges are NOT mapped through
// p() directly — that would skew them into the buildings. Instead they are measured in
// the row's own frame (along the building row / north of its north edge) and then mapped
// onto the scene's axis-aligned wings:
//   • along the row: badge 26 sits over Wing 19, 23 over Wing 18, 12 just past
//     Wing 18's east end;
//   • behind the row: 26 and 23 are ~15–17 m north of the north facade (the
//     "8 M WIDE DRIVEWAY" strip), and the court is further north still (~34 m),
//     in its own hardstanding compound at the north-east corner.
// Wings 18/19 sit at x -40 / -8, z 108, so their north facade is z = 98.
const SEATING_AREA: [number, number] = [-38, 84];
const WALKING_TRACK: [number, number][] = [
  [-24, 88],
  [-11, 83],
  [2, 86],
  [12, 80],
];
const BASKETBALL_COURT: [number, number] = [10, 66];
// The court sits on pale hardstanding, not lawn (as on the plan).
const COURT_GROUND = { center: [10, 66] as [number, number], size: [30, 18] as [number, number] };

// Grass cover laid on the campus floor. The floor itself is a neutral grey (see palette.ts),
// so these green areas are what read as "grass" — they sit on top of the floor as a thin
// layer at y = 0.04, just above it. They follow the landscaped areas of the master plan:
//   • the green spine of the North Campus, between the Wing 08–11 row and the Wing 01–04
//     row, around the Olympus Plaza roundabout (badge 16);
//   • the tree-lined green edge down the west side of the North Campus;
//   • the lawn between the Wing 18 / 19 north facade (z = 98) and the walking track;
//   • the central courtyard of the South Campus, between the Wing 18/19 and Wing 16/17 rows.
const GRASS_AREAS: { center: [number, number]; size: [number, number] }[] = [
  { center: [20, -146], size: [180, 16] }, // landscaped spine + Olympus Plaza, North Campus
  { center: [-130, -148], size: [26, 140] }, // tree-lined west edge of the North Campus
  { center: [-24, 95], size: [80, 5.5] }, // lawn behind the Wing 18 / 19 row
  { center: [-24, 141], size: [64, 30] }, // central courtyard, South Campus
];
// Verges either side of the campus drive leading in from the south gate.
const DRIVE_VERGES: { center: [number, number]; size: [number, number] }[] = [
  { center: [-44.5, -28], size: [2.5, 36] },
  { center: [-31.5, -28], size: [2.5, 36] },
];

// The south campus entrance gate — master plan spot **01**, the "gate to south campus"
// photo. On the plan it is drawn as an ENTRY and an EXIT gate side by side, separated
// by a small planted island, at the T-junction where the campus driveway meets the
// CDP road. Measured in masterplan-full.webp px: the badge sits at (298, 324); the CDP
// road runs E-W at world z -64.8..-51.6 and the campus driveway N-S at world x -43.8..-28.8.
// So the pair straddles the driveway, on the road, facing south into the campus.
const SOUTH_CAMPUS_GATE: [number, number] = [-36, -52];
// The campus driveway running south from the gate into the South Campus (8 m wide on
// the plan), so the gate reads as an entrance rather than a free-standing structure.
const CAMPUS_DRIVE = { center: [-38, -30] as [number, number], size: [9, 46] as [number, number] };
const SOUTH_CAMPUS_GATE_ROTATION = 0;

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

/** Site centre the sun light orbits around and its shadow camera covers. */
const SUN_TARGET: [number, number, number] = [-20, 0, 20];
const SUN_DISTANCE = 450;

/**
 * Directional sunlight placed along the real solar direction for the chosen time, with a shadow
 * camera sized to the whole site. Warms and dims toward sunrise/sunset; off below the horizon.
 */
function Sunlight({ sun }: { sun: SunPosition }) {
  const light = useRef<THREE.DirectionalLight>(null);
  const [dx, dy, dz] = sun.direction;
  const position: [number, number, number] = [
    SUN_TARGET[0] + dx * SUN_DISTANCE,
    SUN_TARGET[1] + dy * SUN_DISTANCE,
    SUN_TARGET[2] + dz * SUN_DISTANCE,
  ];
  const up = THREE.MathUtils.clamp(sun.altitude / 25, 0, 1); // 0 at horizon, 1 above 25°
  const color = new THREE.Color("#ff9a4d").lerp(new THREE.Color("#fff6e5"), up);

  useEffect(() => {
    const l = light.current;
    if (!l) return;
    l.target.position.set(...SUN_TARGET);
    l.target.updateMatrixWorld();
    l.shadow.needsUpdate = true;
  });

  if (sun.altitude <= 0) return null;
  return (
    <directionalLight
      ref={light}
      position={position}
      color={color}
      intensity={0.6 + 1.6 * up}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-bias={-0.0004}
      shadow-normalBias={0.6}
      shadow-camera-left={-280}
      shadow-camera-right={280}
      shadow-camera-top={280}
      shadow-camera-bottom={-280}
      shadow-camera-near={50}
      shadow-camera-far={1000}
    />
  );
}

interface CampusSceneProps {
  mode: "day" | "night";
  onSelectWing: (wing: Wing) => void;
  highlightedWingId?: string;
  /** Sun for the chosen time of day; when set (day mode) it drives sky, light and shadows. */
  sun?: SunPosition;
}

export function CampusScene({ mode, onSelectWing, highlightedWingId, sun }: CampusSceneProps) {
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
          <Sky
            sunPosition={sun ? sun.direction : [80, 40, -40]}
            turbidity={sun && sun.altitude < 15 ? 8 : 4}
            rayleigh={sun && sun.altitude < 15 ? 2.5 : 1.5}
          />
          {/* the floor is now a neutral grey, so the bounce light off it is neutral too */}
          <hemisphereLight
            intensity={sun ? 0.25 + 0.35 * THREE.MathUtils.clamp(sun.altitude / 30, 0, 1) : 0.6}
            groundColor="#b9bab6"
          />
          {sun ? (
            <Sunlight sun={sun} />
          ) : (
            <directionalLight position={[80, 90, -40]} intensity={1.6} castShadow shadow-mapSize={[2048, 2048]} />
          )}
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
        <meshStandardMaterial color={mode === "day" ? FLOOR_OUT_DAY : FLOOR_OUT_NIGHT} roughness={1} />
      </mesh>

      {/* campus plots — the floor the wings stand on */}
      {[NORTH_PLOT, SOUTH_PLOT_WEST, SOUTH_PLOT_EAST].map((plot, i) => (
        <Ground key={i} center={plot.center} size={plot.size} y={0.03} color={mode === "day" ? FLOOR_DAY : FLOOR_NIGHT} />
      ))}

      {/* grass cover laid on the floor — the only green on the ground plane */}
      {GRASS_AREAS.map((area, i) => (
        <Ground key={`grass-${i}`} center={area.center} size={area.size} y={0.04} color={mode === "day" ? GRASS : GRASS_NIGHT} />
      ))}
      {DRIVE_VERGES.map((verge, i) => (
        <Ground key={`verge-${i}`} center={verge.center} size={verge.size} y={0.04} color={mode === "day" ? GRASS : GRASS_NIGHT} />
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

      {/* landscape strip behind the Wing 18 / Wing 19 pair */}
      <Ground center={COURT_GROUND.center} size={COURT_GROUND.size} y={0.04} color={mode === 'day' ? '#cfc4a8' : '#1b1d20'} />
      <Ground center={CAMPUS_DRIVE.center} size={CAMPUS_DRIVE.size} y={0.045} color={mode === "day" ? "#8e8e8a" : "#2a2a2e"} />
      <SouthCampusGate position={SOUTH_CAMPUS_GATE} rotation={SOUTH_CAMPUS_GATE_ROTATION} mode={mode} />
      <SeatingArea position={SEATING_AREA} mode={mode} />
      <WalkingTrack points={WALKING_TRACK} mode={mode} />
      <BasketballCourt position={BASKETBALL_COURT} mode={mode} />
      {walkways.map((w, i) => (
        <Walkway key={`walkway-${i}`} from={w.from} to={w.to} />
      ))}

      {wings.map((wing) => (
        wing.detailedModel && (wing.number === 16 || wing.number === 17) ? (
          <Wing17Model
            key={wing.id}
            wing={wing}
            mode={mode}
            showLabel
            highlighted={wing.id === highlightedWingId}
            onSelect={onSelectWing}
          />
        ) : wing.detailedModel ? (
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
