// Wing data derived from the full-site master plan (Complete-Master-Plan-Sobha-Neopolis.webp)
// plus the North/South campus detail sheets. Precise surveyed GPS/footprint coordinates have
// NOT been supplied yet (see requirements.md §9.1).
//
// Positions are traced from wing centres on the full-site plan image and scaled to metres:
//   x = (px - 360) * PLAN_SCALE,  z = (py - 400) * PLAN_SCALE   (north = -z, east = +x)
// PLAN_SCALE assumes the 18 m CDP road (~30 px wide on the image) — the plan is marked
// "not to scale", so spacing is proportionally faithful, not surveyed.

import { WING18_FLOORS } from "./flats";

export type Campus = "north" | "south";

export interface Wing {
  id: string; // "wing-01"
  number: number; // 1..19
  name: string; // "Wing-01"
  campus: Campus;
  cluster: string; // human description of its block, per master plan
  /** Wings this one is directly footpath/courtyard-connected to, if confirmed. */
  connectors?: { wingNumber: number; via: string }[];
  /**
   * SCHEMATIC site-wide position (meters), NOT a surveyed coordinate.
   * Captures the confirmed relative layout (cluster, row, column) from the
   * master-plan detail images so the 3D scene reads correctly; swap for
   * real footprint/GPS data once supplied (§9).
   */
  position: [number, number]; // [x, z]
  floors: number; // placeholder massing height, not a confirmed spec
  /** Uses the detailed Wing-18 tower model (twin towers, portal, flats) instead of the generic block. */
  detailedModel: boolean;
  /** Yaw in radians; 0 = entrance facing +z (plan south). */
  rotation: number;
}

interface RawWing {
  number: number;
  cluster: string;
  position: [number, number];
  connectors?: { wingNumber: number; via: string }[];
  floors?: number;
  detailedModel?: boolean;
  rotation?: number;
}

const FLOORS = 20; // placeholder, matches the ~20-storey towers visible in reference photos — not a confirmed spec

export const PLAN_SCALE = 0.6; // metres per plan pixel
const ORIGIN_PX: [number, number] = [360, 400];
const plan = (px: number, py: number): [number, number] => [
  (px - ORIGIN_PX[0]) * PLAN_SCALE,
  (py - ORIGIN_PX[1]) * PLAN_SCALE,
];

/** 18 m wide proposed CDP road separating the North Campus from the South Campus / lake. */
export const CDP_ROAD = { z: plan(0, 293)[1], width: 18 };

// North Campus — north of the CDP road. Wings 07/06/05 west column, 08-11 top row,
// 04-01 bottom row facing the road.
const northWings: RawWing[] = [
  { number: 7, cluster: "West column", position: plan(190, 85) },
  { number: 6, cluster: "West column", position: plan(205, 165) },
  { number: 5, cluster: "West column", position: plan(195, 225) },
  { number: 8, cluster: "North row, around the Olympus Plaza roundabout", position: plan(285, 110) },
  { number: 9, cluster: "North row, around the Olympus Plaza roundabout", position: plan(375, 85) },
  { number: 10, cluster: "North row, around the Olympus Plaza roundabout", position: plan(470, 85) },
  { number: 11, cluster: "North row, around the Olympus Plaza roundabout", position: plan(520, 115) },
  { number: 4, cluster: "South row, facing the CDP road", position: plan(285, 210) },
  { number: 3, cluster: "South row, facing the CDP road", position: plan(375, 210) },
  { number: 2, cluster: "South row, facing the CDP road", position: plan(470, 210) },
  { number: 1, cluster: "South row, facing the CDP road", position: plan(560, 210) },
];

// South Campus — south of the CDP road, laid out from `SNP South Campus.png`:
// Wings 12-15 west column; Wing-19 + Wing-18 are one attached row on the north side of the
// central courtyard (amenity 06); Wing-16 + Wing-17 are the attached row directly opposite on
// the south side. Each pair shares a party wall (WING18_SPAN = full width of the Wing-18 model).
// Row z values are anchored to the full-site plan; x spacing follows the South Campus sheet.
export const WING18_SPAN = 32; // twin-tower width of the detailed Wing-18 model (side walls at x = ±16)
const SOUTH_ROW_X = plan(320, 0)[0]; // centre between the pairs
const NORTH_ROW_Z = plan(0, 580)[1];
const SOUTH_ROW_Z = plan(0, 690)[1];
const pairX = (k: -1 | 1) => SOUTH_ROW_X + (k * WING18_SPAN) / 2;

const southWings: RawWing[] = [
  { number: 12, cluster: "West column", position: plan(205, 480) },
  { number: 13, cluster: "West column", position: plan(180, 535) },
  { number: 14, cluster: "West column", position: plan(160, 610) },
  { number: 15, cluster: "West column", position: plan(150, 680) },
  {
    number: 19,
    cluster: "North row, attached to Wing-18, facing the central courtyard",
    position: [pairX(-1), NORTH_ROW_Z],
    floors: WING18_FLOORS,
    detailedModel: true,
  },
  {
    number: 18,
    cluster: "North row, attached to Wing-19, facing the central courtyard",
    position: [pairX(1), NORTH_ROW_Z],
    connectors: [{ wingNumber: 17, via: "Walkway across the central courtyard" }],
    floors: WING18_FLOORS,
    detailedModel: true,
  },
  // The sheet draws 16/17 with the same twin-tower footprint as 18/19; only 18/19 have photos, so
  // these use the generic block at the same width, rotated so their entrances face the courtyard.
  {
    number: 16,
    cluster: "South row, attached to Wing-17, opposite Wing-19 across the courtyard",
    position: [pairX(-1), SOUTH_ROW_Z],
    rotation: Math.PI,
  },
  {
    number: 17,
    cluster: "South row, attached to Wing-16, opposite Wing-18 across the courtyard",
    position: [pairX(1), SOUTH_ROW_Z],
    connectors: [{ wingNumber: 18, via: "Walkway across the central courtyard" }],
    rotation: Math.PI,
  },
];

function toWing(raw: RawWing, campus: Campus): Wing {
  const name = `Wing-${String(raw.number).padStart(2, "0")}`;
  return {
    id: name.toLowerCase(),
    number: raw.number,
    name,
    campus,
    cluster: raw.cluster,
    connectors: raw.connectors,
    position: raw.position,
    floors: raw.floors ?? FLOORS,
    detailedModel: raw.detailedModel ?? false,
    rotation: raw.rotation ?? 0,
  };
}

export const wings: Wing[] = [
  ...northWings.map((w) => toWing(w, "north")),
  ...southWings.map((w) => toWing(w, "south")),
].sort((a, b) => a.number - b.number);

export function getWing(id: string): Wing | undefined {
  return wings.find((w) => w.id === id);
}

export function wingsByCampus(campus: Campus): Wing[] {
  return wings.filter((w) => w.campus === campus);
}

// Ground footprint of each wing, used for massing + lawn/pool layout.
// Placeholder (not from architectural drawings) — see requirements.md §9.
export const WING_WIDTH = 16;
export const WING_DEPTH = 34;
