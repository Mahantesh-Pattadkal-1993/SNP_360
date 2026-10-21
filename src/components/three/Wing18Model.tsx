"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import type { Wing } from "@/data/wings";
import { seriesFor } from "@/data/flats";

type Mode = "day" | "night";

// Wing-18, modeled from the supplied photos:
//  - building entrance.jpg      → arched portal, slatted vault, rosette, glass door, lanterns, "18"
//  - Buidings.webp              → facade rhythm on front + back: arched window column, recessed balcony
//                                 column (staggered slabs, planters, black railings), lattice grill strip,
//                                 outer white-framed mullioned window column with a flat black grill in
//                                 front of it
//  - Wing18_Side.jpeg           → the facade ends in ONE MORE COLUMN beyond the long-window column:
//                                 stacked corbelled projecting balconies on every floor, so each flat
//                                 reads with a second balcony beside the window (not in front of it)
//  - real building picture.jpg  → pediment gables, corbel cornices, arched top recesses with rosettes
//  - wing 18 backside distant view.jpeg → the BACK (north) face: a WIDE pediment gable over the
//                                 series 3 flats, and the other tower ending in a plain flat
//                                 parapet (no gable) — so the pediment is not on every tower.
// Per the master plan numbering, series 3 (2481 Grande East) and series 4 (2841 Elite North)
// are the east tower's flats, so the pediment belongs to the east tower only — and the same
// wide gable caps both of that tower's faces (series 3 at the back, series 4 at the front).
// Wing 19 is the attached MIRRORED twin: its series 3 & 4 are on its WEST tower, so it gets the
// same wide gable on its west tower — the outer end of the pair, mirroring Wing 18.
// Dimensions are estimated from photo proportions, not architectural drawings (requirements.md §9).
const FH = 3.2; // floor height
const TOWER_W = 18;
const CORE_W = 4;
const DEPTH = 20;
const FRONT = DEPTH / 2; // tower front face (z)
const CORE_FRONT = FRONT - 3; // core is recessed behind the tower faces
const CORE_EDGE = CORE_W / 2;
const BAY_W = 5; // projecting window bay beside the core
const BAY_X = CORE_EDGE + 0.7 + BAY_W / 2;
const TOWER_X = CORE_EDGE + TOWER_W / 2;
const SIDE_X = TOWER_X + TOWER_W / 2; // outer side face (x)
const LOGGIA_W = 4; // recessed balcony column
const LOGGIA_X = BAY_X + BAY_W / 2 + 0.3 + LOGGIA_W / 2;
const JALI_W = 0.7; // lattice grill strip
const JALI_X = LOGGIA_X + LOGGIA_W / 2 + 0.3 + JALI_W / 2;
const OUTER_WIN_X = JALI_X + JALI_W / 2 + 0.3 + 1.2; // outer white-framed mullioned window column
// The extra column at the outer end of the facade — the balconies seen beside the long window.
const OUTER_BAL_W = 3.2;
const OUTER_BAL_X = SIDE_X - 0.4 - OUTER_BAL_W / 2;
const OUTER_BAL_DEPTH = 1.2; // how far the outer balconies project from the facade
const OUTER_BAL_RAIL_H = 1.05;
const OUTER_BAL_FLOOR = 0.43; // balcony floor level = window sill level
const PORTAL_HALF = 3.6;
const ARCH_R = 2.3;
const SPRING = 4.4;
const PORTAL_TOP = 7.4;
const PORTAL_FLOOR = 0.6;
const RAIL_H = 1.05;
const SIDES = [-1, 1] as const;
const CORNICE_FLOORS = [3, 8, 13];
// The pediment gable that crowns the Wing 18 series 3 & 4 tower — a WIDE gable over the
// loggia, jali and outer-window bays ("wing 18 backside distant view.jpeg"). It stops at the
// inner edge of the outer balcony column, which reads as its own bay, and the other tower
// of the wing ends in a plain flat parapet, with no gable at all.
const PEDIMENT_X0 = CORE_EDGE; // starts at the core slot
const PEDIMENT_X1 = OUTER_BAL_X - OUTER_BAL_W / 2; // stops before the outer balcony column
const PEDIMENT_W = PEDIMENT_X1 - PEDIMENT_X0;
const PEDIMENT_CX = (PEDIMENT_X0 + PEDIMENT_X1) / 2;
const PEDIMENT_H = 3; // gable height above the cornice (≈1 floor, per the back photo)
const PEDIMENT_DENTILS = 16; // small blocks along the cornice under the gable
// The tower that carries the series 3 & 4 flats — the only tower with a pediment.
// This is wing-dependent: the 18/19 pair is mirrored, so Wing 18's series 3 & 4 are on its east
// tower and Wing 19's are on its west tower (the outer end of the pair in both cases).
// Derived from the series map rather than hard-coded, so it follows the data.
const pedimentSide = (wingNumber: number): -1 | 1 => seriesFor(wingNumber)[3].tower;

// ---------- canvas textures (no network fonts/assets needed) ----------

const textureCache = new Map<string, THREE.CanvasTexture>();

function canvasTexture(key: string, width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const cached = textureCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d")!);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  textureCache.set(key, texture);
  return texture;
}

const railingMaterials = new Map<number, THREE.MeshStandardMaterial>();

/** Black wrought-iron railing (top rail, bottom rail, bars ~12cm apart) as an alpha-tested plane. */
function railingMaterial(width: number) {
  let material = railingMaterials.get(width);
  if (!material) {
    const bars = Math.max(6, Math.round(width * 8));
    const map = canvasTexture(`rail-${width}`, 512, 128, (ctx) => {
      ctx.fillStyle = "#151515";
      ctx.fillRect(0, 0, 512, 10);
      ctx.fillRect(0, 114, 512, 8);
      ctx.fillRect(0, 0, 8, 128);
      ctx.fillRect(504, 0, 8, 128);
      for (let i = 1; i < bars; i++) ctx.fillRect((i * 512) / bars - 2, 10, 4, 104);
    });
    material = new THREE.MeshStandardMaterial({
      map,
      transparent: true,
      alphaTest: 0.35,
      side: THREE.DoubleSide,
      roughness: 0.5,
      metalness: 0.3,
    });
    railingMaterials.set(width, material);
  }
  return material;
}

/**
 * The extra column at the outer end of the front/back facade (Wing18_Side.jpeg).
 *
 * In the photo the facade runs: [jali strip] [long window with a flat black grill in front of it]
 * [ONE MORE COLUMN: a stack of corbelled projecting balconies on every floor] — the balconies sit
 * BESIDE the window, never in front of it, so every flat reads with a second balcony.
 *
 * `side` is the face-local sign: -1 = west tower, 1 = east tower (the back face is drawn with the
 * opposite sign and a 180° rotation, which mirrors it correctly).
 */
function OuterBalconyColumn({
  side,
  floors,
  faceSeed,
  m,
}: {
  side: -1 | 1;
  floors: number;
  faceSeed: number;
  m: Materials;
}) {
  const height = floors * FH;
  const x = side * OUTER_BAL_X;
  const halfW = OUTER_BAL_W / 2;
  const railW = OUTER_BAL_W - 0.2;

  return (
    <group>
      {/* Pilasters framing the column, so it reads as a separate bay of the facade */}
      {[-1, 1].map((s) => (
        <Box
          key={s}
          args={[0.35, height, 0.4]}
          position={[x + s * (halfW + 0.18), height / 2, 0.2]}
          material={m.trim}
        />
      ))}
      {/* Cornice over the column */}
      <Box args={[OUTER_BAL_W + 1.1, 0.35, 0.9]} position={[x, height - 0.2, 0.3]} material={m.trim} />

      {Array.from({ length: floors }, (_, floor) => {
        const y0 = floor * FH;
        const lit = isLit(floor * 41 + side * 17 + faceSeed);
        // balcony floor sits at the window-sill level, as in the photo
        const yb = y0 + OUTER_BAL_FLOOR;

        if (floor === 0) {
          // Ground floor: a plain doorway/window, no balcony above it.
          return (
            <group key={floor}>
              <FramedWindow x={x} y0={y0} z={0} width={2.2} lit={lit} m={m} />
            </group>
          );
        }

        return (
          <group key={floor}>
            {/* Door/window set back in the wall behind the balcony */}
            <FramedWindow x={x} y0={y0} z={0} width={2.2} lit={lit} m={m} />

            {/* Cantilevered balcony slab projecting from the facade */}
            <Box
              args={[OUTER_BAL_W, 0.22, OUTER_BAL_DEPTH]}
              position={[x, yb - 0.11, OUTER_BAL_DEPTH / 2]}
              material={m.slab}
            />
            {/* Corbels carrying the slab */}
            {[-1, 1].map((s) => (
              <Box
                key={s}
                args={[0.3, 0.5, 0.45]}
                position={[x + s * (halfW - 0.35), yb - 0.45, 0.28]}
                material={m.trim}
              />
            ))}
            {/* Black railing along the outer edge of the slab */}
            <Plane
              args={[railW, OUTER_BAL_RAIL_H]}
              position={[x, yb + OUTER_BAL_RAIL_H / 2, OUTER_BAL_DEPTH]}
              material={railingMaterial(railW)}
            />
            {/* Railing returns down the two sides of the balcony */}
            {[-1, 1].map((s) => (
              <Plane
                key={s}
                args={[OUTER_BAL_DEPTH, OUTER_BAL_RAIL_H]}
                position={[x + s * halfW, yb + OUTER_BAL_RAIL_H / 2, OUTER_BAL_DEPTH / 2]}
                rotation={[0, (-s * Math.PI) / 2, 0]}
                material={railingMaterial(OUTER_BAL_DEPTH)}
              />
            ))}
            {/* Planter on alternate floors, as in the photo */}
            {floor % 2 === 1 && (
              <Box
                args={[OUTER_BAL_W * 0.5, 0.35, 0.3]}
                position={[x, yb + 0.18, OUTER_BAL_DEPTH - 0.2]}
                material={m.trim}
              />
            )}
          </group>
        );
      })}
    </group>
  );
}

/** Pseudo-random but stable per window, so the same flats are lit every render. */
function isLit(seed: number) {
  const v = Math.sin(seed * 127.1) * 43758.5453;
  return v - Math.floor(v) < 0.6;
}

// ---------- shapes ----------

/** U-shaped arch moulding (open at the bottom) — the arched surrounds on the bays. */
function archMouldingShape(innerHalf: number, spring: number, thickness: number) {
  const outer = innerHalf + thickness;
  const s = new THREE.Shape();
  s.moveTo(-outer, 0);
  s.lineTo(-outer, spring);
  s.absarc(0, spring, outer, Math.PI, 0, true);
  s.lineTo(outer, 0);
  s.lineTo(innerHalf, 0);
  s.lineTo(innerHalf, spring);
  s.absarc(0, spring, innerHalf, 0, Math.PI, false);
  s.lineTo(-innerHalf, 0);
  s.closePath();
  return s;
}

// ---------- primitives ----------

type Vec3 = [number, number, number];

function Box({
  args,
  position,
  material,
  rotation,
  shadow = true,
}: {
  args: Vec3;
  position: Vec3;
  material: THREE.Material;
  rotation?: Vec3;
  shadow?: boolean;
}) {
  return (
    <mesh position={position} rotation={rotation} material={material} castShadow={shadow} receiveShadow>
      <boxGeometry args={args} />
    </mesh>
  );
}

function Plane({
  args,
  position,
  material,
  rotation,
}: {
  args: [number, number];
  position: Vec3;
  material: THREE.Material;
  rotation?: Vec3;
}) {
  return (
    <mesh position={position} rotation={rotation} material={material}>
      <planeGeometry args={args} />
    </mesh>
  );
}

// ---------- materials ----------

type MaterialKey =
  | "stucco" | "trim" | "trimDouble" | "plinth" | "core" | "slab" | "glass" | "glassLit" | "doorGlass"
  | "recess" | "frame" | "lattice" | "metal" | "wood" | "lantern" | "topiary" | "foliage" | "flowers"
  | "whitePot" | "clayPot" | "paving" | "lawn";

type Materials = Record<MaterialKey, THREE.MeshStandardMaterial>;

function useMaterials(mode: Mode, highlighted: boolean, floors: number): Materials {
  return useMemo((): Materials => {
    const night = mode === "night";
    const lattice = canvasTexture("lattice", 64, 128, (ctx) => {
      ctx.fillStyle = "#cdb995";
      ctx.fillRect(0, 0, 64, 128);
      ctx.strokeStyle = "#7d6c52";
      ctx.lineWidth = 5;
      for (let k = -128; k < 192; k += 21) {
        ctx.beginPath();
        ctx.moveTo(0, k);
        ctx.lineTo(64, k + 64);
        ctx.moveTo(0, k + 64);
        ctx.lineTo(64, k);
        ctx.stroke();
      }
    }).clone();
    lattice.wrapT = THREE.RepeatWrapping;
    lattice.repeat.set(1, floors * 1.2);
    lattice.needsUpdate = true;
    return {
      stucco: new THREE.MeshStandardMaterial({ color: highlighted ? "#a8d5b5" : "#dbc6a2", roughness: 0.92 }),
      trim: new THREE.MeshStandardMaterial({ color: "#ecdfc4", roughness: 0.85 }),
      trimDouble: new THREE.MeshStandardMaterial({ color: "#ecdfc4", roughness: 0.85, side: THREE.DoubleSide }),
      plinth: new THREE.MeshStandardMaterial({ color: "#b3a284", roughness: 0.95 }),
      core: new THREE.MeshStandardMaterial({ color: "#d8bba5", roughness: 0.92 }),
      slab: new THREE.MeshStandardMaterial({ color: "#e4d5b7", roughness: 0.9 }),
      glass: new THREE.MeshStandardMaterial({
        color: night ? "#1a2230" : "#46586a",
        roughness: 0.12,
        metalness: 0.55,
      }),
      glassLit: new THREE.MeshStandardMaterial({
        color: night ? "#ffd9a0" : "#46586a",
        emissive: night ? "#ffae52" : "#000000",
        emissiveIntensity: night ? 1.3 : 0,
        roughness: 0.2,
        metalness: night ? 0 : 0.55,
      }),
      doorGlass: new THREE.MeshStandardMaterial({
        color: night ? "#ffe1ad" : "#8c9aa3",
        emissive: night ? "#ffb35a" : "#000000",
        emissiveIntensity: night ? 1.6 : 0,
        roughness: 0.15,
        metalness: night ? 0 : 0.4,
      }),
      metal: new THREE.MeshStandardMaterial({ color: "#1d1b18", roughness: 0.5, metalness: 0.4 }),
      recess: new THREE.MeshStandardMaterial({ color: night ? "#2a2520" : "#8f8574", roughness: 1 }),
      frame: new THREE.MeshStandardMaterial({ color: "#f5f1e8", roughness: 0.6 }),
      lattice: new THREE.MeshStandardMaterial({ map: lattice, roughness: 0.95 }),
      flowers: new THREE.MeshStandardMaterial({ color: "#b9a63a", roughness: 1 }),
      wood: new THREE.MeshStandardMaterial({ color: "#a9824f", roughness: 0.8 }),
      lantern: new THREE.MeshStandardMaterial({
        color: night ? "#ffe2a8" : "#d9d2c0",
        emissive: night ? "#ffb04d" : "#000000",
        emissiveIntensity: night ? 2.5 : 0,
      }),
      topiary: new THREE.MeshStandardMaterial({ color: "#8f7d3b", roughness: 1 }),
      foliage: new THREE.MeshStandardMaterial({ color: "#55702f", roughness: 1 }),
      whitePot: new THREE.MeshStandardMaterial({ color: "#f1ede4", roughness: 0.7 }),
      clayPot: new THREE.MeshStandardMaterial({ color: "#7a3f22", roughness: 0.9 }),
      paving: new THREE.MeshStandardMaterial({ color: "#cfc6b4", roughness: 1 }),
      lawn: new THREE.MeshStandardMaterial({ color: "#5f8f45", roughness: 1 }),
    };
  }, [mode, highlighted, floors]);
}


// ---------- parts ----------

function Rosette({ position, size }: { position: Vec3; size: number }) {
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: canvasTexture("rosette", 256, 256, (ctx) => {
          ctx.strokeStyle = "#8a7a5e";
          ctx.lineWidth = 12;
          ctx.beginPath();
          ctx.arc(128, 128, 110, 0, Math.PI * 2);
          ctx.stroke();
          ctx.lineWidth = 7;
          for (let i = 0; i < 8; i++) {
            ctx.save();
            ctx.translate(128, 128);
            ctx.rotate((i * Math.PI) / 4);
            ctx.beginPath();
            ctx.ellipse(0, -52, 20, 44, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
          ctx.beginPath();
          ctx.arc(128, 128, 18, 0, Math.PI * 2);
          ctx.stroke();
        }),
        transparent: true,
        alphaTest: 0.3,
      }),
    [],
  );
  return <Plane args={[size, size]} position={position} material={material} />;
}

/**
 * Arched window column beside the core (Buidings.webp): stacked mullioned windows with white frames
 * and sills, grouped by arched surrounds, with a rosette arch at the top. Drawn in face-local coords
 * (face plane at z=0, facing +z); mounted on both the front and back faces.
 */
function WindowBay({ side, floors, m }: { side: -1 | 1; floors: number; m: Materials }) {
  const height = floors * FH;
  const x = side * BAY_X;
  const face = 0.5;
  const arches = useMemo(
    () => [
      { y: 0.3, geometry: new THREE.ExtrudeGeometry(archMouldingShape(1.6, 4.6, 0.35), { depth: 0.18, bevelEnabled: false }) },
      { y: 2 * FH + 0.2, geometry: new THREE.ExtrudeGeometry(archMouldingShape(1.5, 1.5, 0.3), { depth: 0.18, bevelEnabled: false }) },
      {
        y: (floors - 2) * FH + 0.2,
        geometry: new THREE.ExtrudeGeometry(archMouldingShape(1.6, 4.4, 0.35), { depth: 0.18, bevelEnabled: false }),
      },
    ],
    [floors],
  );

  return (
    <group>
      <Box args={[BAY_W, height + 1.2, 0.5]} position={[x, (height + 1.2) / 2, 0.25]} material={m.stucco} />
      {arches.map((arch, i) => (
        <mesh key={i} position={[x, arch.y, face]} geometry={arch.geometry} material={m.trim} castShadow />
      ))}
      <Rosette position={[x, (floors - 2) * FH + 0.2 + 4.4 + 0.75, face + 0.02]} size={1.1} />
      {Array.from({ length: floors }, (_, floor) => (
        <FramedWindow key={floor} x={x} y0={floor * FH} z={face} width={2.2} lit={isLit(floor * 7 + side * 3)} m={m} />
      ))}
    </group>
  );
}

/** White-framed window with a centre mullion, transom and a projecting sill, as in Buidings.webp. */
function FramedWindow({
  x,
  y0,
  z,
  width,
  lit,
  m,
}: {
  x: number;
  y0: number;
  z: number;
  width: number;
  lit: boolean;
  m: Materials;
}) {
  const h = 2;
  const yc = y0 + 1.5;
  return (
    <group>
      <Plane args={[width, h]} position={[x, yc, z + 0.01]} material={lit ? m.glassLit : m.glass} />
      <Box args={[width + 0.24, 0.12, 0.08]} position={[x, yc + h / 2, z + 0.04]} material={m.frame} shadow={false} />
      <Box args={[0.12, h, 0.08]} position={[x - width / 2, yc, z + 0.04]} material={m.frame} shadow={false} />
      <Box args={[0.12, h, 0.08]} position={[x + width / 2, yc, z + 0.04]} material={m.frame} shadow={false} />
      <Box args={[0.07, h, 0.06]} position={[x, yc, z + 0.04]} material={m.frame} shadow={false} />
      <Box args={[width, 0.07, 0.06]} position={[x, yc + h * 0.22, z + 0.04]} material={m.frame} shadow={false} />
      <Box args={[width + 0.5, 0.16, 0.4]} position={[x, y0 + 0.43, z + 0.15]} material={m.trim} shadow={false} />
    </group>
  );
}

/**
 * Front/back facade columns outside the arched bay (Buidings.webp), in face-local coords:
 * a recessed balcony column with staggered cantilever slabs, planters and black railings;
 * a lattice (jali) grill strip; and an outer column of white-framed mullioned windows with a flat
 * black railing (grill) in front of them — no balcony in front of the window.
 */
function FacadeColumns({ side, floors, faceSeed, m }: { side: -1 | 1; floors: number; faceSeed: number; m: Materials }) {
  const height = floors * FH;
  const depth = LOGGIA_DEPTH;
  return (
    <group>
      {/* dark recess behind the balconies */}
      <Plane args={[LOGGIA_W, height - FH]} position={[side * LOGGIA_X, FH + (height - FH) / 2, -depth]} material={m.recess} />
      {SIDES.map((wall) => (
        <Plane
          key={wall}
          args={[depth, height - FH]}
          position={[side * LOGGIA_X + (wall * LOGGIA_W) / 2, FH + (height - FH) / 2, -depth / 2]}
          rotation={[0, (-wall * Math.PI) / 2, 0]}
          material={m.stucco}
        />
      ))}
      {/* lattice grill strip */}
      <Box args={[JALI_W, height - FH * 2, 0.12]} position={[side * JALI_X, FH + (height - FH * 2) / 2 + FH / 2, 0.06]} material={m.lattice} />

      {Array.from({ length: floors }, (_, floor) => {
        const y0 = floor * FH;
        const lit = isLit(floor * 13 + side * 5 + faceSeed);
        if (floor === 0) {
          return (
            <group key={floor}>
              <FramedWindow x={side * LOGGIA_X} y0={y0} z={0} width={2.8} lit={lit} m={m} />
              <FramedWindow x={side * OUTER_WIN_X} y0={y0} z={0} width={2.4} lit={!lit} m={m} />
            </group>
          );
        }
        // balconies alternate between the inner and outer half of the loggia, as in the photo
        const stagger = floor % 2 === 0 ? -1 : 1;
        const slabW = LOGGIA_W * 0.62;
        const slabX = side * (LOGGIA_X + stagger * (LOGGIA_W - slabW) / 2);
        return (
          <group key={floor}>
            {/* French window at the back of the loggia */}
            <Plane args={[LOGGIA_W * 0.7, 2.3]} position={[side * LOGGIA_X, y0 + 1.25, -depth + 0.02]} material={lit ? m.glassLit : m.glass} />
            {/* full-width floor slab edge */}
            <Box args={[LOGGIA_W, 0.3, depth]} position={[side * LOGGIA_X, y0 - 0.15, -depth / 2]} material={m.slab} />
            {/* cantilevered slab with a solid parapet planter */}
            <Box args={[slabW, 0.4, 1.4]} position={[slabX, y0 - 0.2, 0.7]} material={m.slab} />
            <Box args={[slabW, 0.55, 0.25]} position={[slabX, y0 + 0.28, 1.28]} material={m.trim} />
            <mesh position={[slabX, y0 + 0.7, 1.0]} material={floor % 3 === 0 ? m.flowers : m.foliage} castShadow>
              <boxGeometry args={[slabW * 0.9, 0.5, 0.5]} />
            </mesh>
            {/* black railing across the loggia opening */}
            <Plane args={[LOGGIA_W - 0.2, RAIL_H]} position={[side * LOGGIA_X, y0 + RAIL_H / 2, -0.05]} material={railingMaterial(LOGGIA_W - 0.2)} />
            {/* outer window column — the long window with a flat black GRILL in front of it */}
            <FramedWindow x={side * OUTER_WIN_X} y0={y0} z={0} width={2.4} lit={isLit(floor * 19 + side * 11 + faceSeed)} m={m} />
            <Plane args={[2.7, RAIL_H]} position={[side * OUTER_WIN_X, y0 + 0.43 + RAIL_H / 2, 0.5]} material={railingMaterial(2.7)} />
          </group>
        );
      })}
    </group>
  );
}

const LOGGIA_DEPTH = 2.4;

/** Tower mass with the balcony column cut into the front and back faces above the ground floor. */
function TowerBody({ side, floors, m }: { side: -1 | 1; floors: number; m: Materials }) {
  const height = floors * FH;
  const inner = CORE_W / 2;
  const outer = SIDE_X;
  const loggiaL = LOGGIA_X - LOGGIA_W / 2;
  const loggiaR = LOGGIA_X + LOGGIA_W / 2;
  const coreDepth = DEPTH - LOGGIA_DEPTH * 2;
  const slabs: { from: number; to: number; y0: number; h: number }[] = [
    { from: inner, to: loggiaL, y0: 0, h: height },
    { from: loggiaR, to: outer, y0: 0, h: height },
    { from: loggiaL, to: loggiaR, y0: 0, h: FH },
  ];
  return (
    <group>
      <Box args={[TOWER_W, height, coreDepth]} position={[side * TOWER_X, height / 2, 0]} material={m.stucco} />
      {[1, -1].map((face) =>
        slabs.map((s) => (
          <Box
            key={`${face}-${s.from}`}
            args={[s.to - s.from, s.h, LOGGIA_DEPTH]}
            position={[(side * (s.from + s.to)) / 2, s.y0 + s.h / 2, face * (FRONT - LOGGIA_DEPTH / 2)]}
            material={m.stucco}
          />
        )),
      )}
    </group>
  );
}

/**
 * The wide pediment gable that crowns the Wing 18 series 3 & 4 tower.
 *
 * It spans the loggia, jali and outer-window bays — from the core edge out to just short of
 * the outer balcony column, which reads as its own bay ("wing 18 backside distant view.jpeg").
 * The same gable caps both faces of that tower: series 3 on the back (north) face and series 4
 * on the front (courtyard) face.
 *
 * `face` is the outward direction of the face: +1 = front (+z), -1 = back (-z).
 */
function Pediment({
  side,
  face,
  height,
  m,
}: {
  side: -1 | 1;
  face: 1 | -1;
  height: number;
  m: Materials;
}) {
  const gable = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-PEDIMENT_W / 2, 0);
    s.lineTo(PEDIMENT_W / 2, 0);
    s.lineTo(0, PEDIMENT_H);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 1.4, bevelEnabled: false });
  }, []);

  const x = side * PEDIMENT_CX;
  return (
    <group>
      {/* parapet mass the gable sits on */}
      <Box args={[PEDIMENT_W, 1.5, 8]} position={[x, height + 0.75, face * (FRONT - 4)]} material={m.stucco} />
      {/* cornice and its dentil course */}
      <Box args={[PEDIMENT_W + 0.8, 0.35, 1.6]} position={[x, height + 1.35, face * (FRONT - 0.2)]} material={m.trim} />
      {Array.from({ length: PEDIMENT_DENTILS }, (_, i) => (
        <Box
          key={i}
          args={[0.25, 0.35, 0.3]}
          position={[
            side * (PEDIMENT_X0 + 0.6 + i * ((PEDIMENT_W - 1.2) / (PEDIMENT_DENTILS - 1))),
            height + 1.0,
            face * (FRONT + 0.55),
          ]}
          material={m.trim}
          shadow={false}
        />
      ))}
      <mesh
        position={[x, height + 1.52, face * (FRONT - 0.9)]}
        rotation={[0, face === 1 ? 0 : Math.PI, 0]}
        geometry={gable}
        material={m.trim}
        castShadow
      />
    </group>
  );
}

/**
 * Roof parapet, plus the pediment gable.
 *
 * The gable belongs to the tower that holds the Wing 18 series 3 & 4 flats: the east tower of
 * Wing 18 (master plan: the red "3" and "4" sit on Wing 18's eastern block). The same wide
 * gable caps both of that tower's faces (series 3 on the back, series 4 on the front); the other
 * tower of the wing ends in a plain flat parapet with no gable at all.
 */
function Roof({
  side,
  floors,
  pediment,
  m,
}: {
  side: -1 | 1;
  floors: number;
  /** This tower carries the series 3 & 4 flats, so it gets the pediment. */
  pediment: boolean;
  m: Materials;
}) {
  const height = floors * FH;

  return (
    <group>
      <Box args={[TOWER_W + 0.4, 0.3, DEPTH + 0.4]} position={[side * TOWER_X, height, 0]} material={m.trim} />
      <Box args={[TOWER_W, 0.9, DEPTH]} position={[side * TOWER_X, height + 0.6, 0]} material={m.stucco} />
      {pediment && (
        <>
          <Pediment side={side} face={-1} height={height} m={m} />
          <Pediment side={side} face={1} height={height} m={m} />
        </>
      )}
    </group>
  );
}

/** The arched entrance portal from building entrance.jpg. */
function Portal({ wing, mode, m }: { wing: Wing; mode: Mode; m: Materials }) {
  const night = mode === "night";
  const front = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-PORTAL_HALF, 0);
    s.lineTo(-PORTAL_HALF, PORTAL_TOP);
    s.lineTo(PORTAL_HALF, PORTAL_TOP);
    s.lineTo(PORTAL_HALF, 0);
    s.lineTo(ARCH_R, 0);
    s.lineTo(ARCH_R, SPRING);
    s.absarc(0, SPRING, ARCH_R, 0, Math.PI, false);
    s.lineTo(-ARCH_R, 0);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 1.2, bevelEnabled: false });
  }, []);
  const vault = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(ARCH_R + 0.25, SPRING);
    s.absarc(0, SPRING, ARCH_R + 0.25, 0, Math.PI, false);
    s.lineTo(-ARCH_R, SPRING);
    s.absarc(0, SPRING, ARCH_R, Math.PI, 0, true);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: FRONT + 0.8 - CORE_FRONT, bevelEnabled: false });
  }, []);
  const numberMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: canvasTexture(`num-${wing.number}`, 256, 128, (ctx) => {
          ctx.fillStyle = "#4a3f30";
          ctx.font = "bold 92px Georgia, 'Times New Roman', serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(wing.number), 128, 68);
        }),
        transparent: true,
        alphaTest: 0.3,
      }),
    [wing.number],
  );
  const vaultDepth = FRONT + 0.8 - CORE_FRONT;
  const doorY = PORTAL_FLOOR + 1.7;

  return (
    <group>
      {/* arched front wall with pilasters */}
      <mesh position={[0, 0, FRONT + 0.8]} geometry={front} material={m.trim} castShadow receiveShadow />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Box args={[1.5, 0.35, 1.5]} position={[s * (ARCH_R + 0.65), SPRING, FRONT + 1.4]} material={m.trim} />
          <Box args={[1.5, 0.5, 1.5]} position={[s * (ARCH_R + 0.65), 0.25, FRONT + 1.4]} material={m.plinth} />
          <Box args={[0.25, SPRING, vaultDepth]} position={[s * (ARCH_R + 0.12), SPRING / 2, CORE_FRONT + vaultDepth / 2]} material={m.trim} />
        </group>
      ))}

      {/* entablature with corbels and the wing number */}
      <Box args={[PORTAL_HALF * 2 + 0.6, 1.4, 1.6]} position={[0, PORTAL_TOP + 0.7, FRONT + 1.3]} material={m.trim} />
      <Box args={[PORTAL_HALF * 2 + 1.2, 0.3, 1.9]} position={[0, PORTAL_TOP + 1.55, FRONT + 1.35]} material={m.trim} />
      {Array.from({ length: 5 }, (_, i) => (
        <Box key={i} args={[0.28, 0.5, 0.3]} position={[(i - 2) * 1.2, PORTAL_TOP + 0.3, FRONT + 2.2]} material={m.trim} shadow={false} />
      ))}
      <Plane args={[1.3, 0.65]} position={[0, PORTAL_TOP + 0.95, FRONT + 2.11]} material={numberMaterial} />

      {/* vault with radial timber slats */}
      <mesh position={[0, 0, CORE_FRONT]} geometry={vault} material={m.trimDouble} />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (Math.PI * (i + 1)) / 9;
        const r = ARCH_R - 0.18;
        return (
          <Box
            key={i}
            args={[0.12, 0.35, vaultDepth - 0.6]}
            position={[Math.cos(a) * r, SPRING + Math.sin(a) * r, CORE_FRONT + vaultDepth / 2 + 0.2]}
            rotation={[0, 0, a - Math.PI / 2]}
            material={m.wood}
            shadow={false}
          />
        );
      })}

      {/* raised floor and steps */}
      <Box args={[ARCH_R * 2, PORTAL_FLOOR, vaultDepth + 1.2]} position={[0, PORTAL_FLOOR / 2, CORE_FRONT + (vaultDepth + 1.2) / 2]} material={m.paving} />
      <Box args={[5, 0.4, 0.45]} position={[0, 0.2, FRONT + 2.25]} material={m.paving} />
      <Box args={[5.6, 0.2, 0.45]} position={[0, 0.1, FRONT + 2.7]} material={m.paving} />

      {/* rosette and glazed double door on the recessed back wall */}
      <Rosette position={[0, 5.15, CORE_FRONT + 0.05]} size={1.5} />
      <Box args={[2.7, 3.5, 0.12]} position={[0, doorY, CORE_FRONT + 0.06]} material={m.metal} shadow={false} />
      <Plane args={[2.4, 3.2]} position={[0, doorY, CORE_FRONT + 0.13]} material={m.doorGlass} />
      {[-0.6, 0, 0.6].map((dx) => (
        <Box key={dx} args={[0.05, 3.2, 0.05]} position={[dx, doorY, CORE_FRONT + 0.16]} material={m.metal} shadow={false} />
      ))}
      {[0, 1, 2, 3].map((k) => (
        <Box key={k} args={[2.4, 0.05, 0.05]} position={[0, PORTAL_FLOOR + 0.5 + k * 0.8, CORE_FRONT + 0.16]} material={m.metal} shadow={false} />
      ))}

      {/* lanterns and gold topiary beside the door */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 1.75, PORTAL_FLOOR + 0.7, CORE_FRONT + 1]} material={m.metal}>
            <cylinderGeometry args={[0.05, 0.05, 1.4, 8]} />
          </mesh>
          <mesh position={[s * 1.75, PORTAL_FLOOR + 1.55, CORE_FRONT + 1]} material={m.lantern}>
            <cylinderGeometry args={[0.12, 0.09, 0.35, 8]} />
          </mesh>
          <mesh position={[s * 1.25, PORTAL_FLOOR + 0.22, CORE_FRONT + 1.3]} material={m.whitePot}>
            <cylinderGeometry args={[0.2, 0.16, 0.45, 12]} />
          </mesh>
          <mesh position={[s * 1.25, PORTAL_FLOOR + 0.8, CORE_FRONT + 1.3]} material={m.topiary} castShadow>
            <sphereGeometry args={[0.38, 16, 12]} />
          </mesh>
          {/* potted palms at the foot of the steps */}
          <mesh position={[s * 3.3, 0.3, FRONT + 3.3]} material={m.clayPot}>
            <cylinderGeometry args={[0.25, 0.2, 0.6, 12]} />
          </mesh>
          <mesh position={[s * 3.3, 1.3, FRONT + 3.3]} material={m.foliage} castShadow>
            <coneGeometry args={[0.6, 1.4, 8]} />
          </mesh>
          {night && <pointLight position={[s * 1.75, PORTAL_FLOOR + 1.55, CORE_FRONT + 1.2]} intensity={4} distance={6} color="#ffb04d" />}
        </group>
      ))}
      {night && <pointLight position={[0, 3.2, CORE_FRONT + 1.8]} intensity={18} distance={10} color="#ffc070" />}
      {night && <pointLight position={[0, 1.2, FRONT + 6]} intensity={40} distance={16} decay={1.3} color="#ffc27a" />}

      {/* entrance walkway through a lawn, as in the photo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, FRONT + 11]} material={m.paving} receiveShadow>
        <planeGeometry args={[3, 16]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, FRONT + 9]} material={m.lawn} receiveShadow>
        <planeGeometry args={[34, 14]} />
      </mesh>
    </group>
  );
}

/** Where a flat sits on the Wing-18 model (model-local coords): its facade centre and outward normal. */
export interface FlatPlacement {
  /** Facade centre of the flat on its floor. */
  center: [number, number, number];
  /** Outward direction from the facade (+z front, -z back). */
  normal: 1 | -1;
}

/** Floor `floor` (0 = ground) of the flat on `tower` (-1 west, 1 east) and `face` (1 front, -1 back). */
export function wing18FlatPlacement(floor: number, tower: -1 | 1, face: -1 | 1): FlatPlacement {
  // a corner flat spans from the core edge to the outer end of the tower, i.e. the loggia
  // balcony column, the long window and the new outer balcony column
  const x = (tower * (BAY_X - BAY_W / 2 + SIDE_X)) / 2;
  return { center: [x, floor * FH + FH / 2, face * (FRONT + 0.1)], normal: face };
}

const FLAT_W = SIDE_X - (BAY_X - BAY_W / 2);

/** Glowing outline + translucent panel over one flat's facade, with a floating flat-number tag. */
function FlatHighlight({ code, placement }: { code: string; placement: FlatPlacement }) {
  const [cx, cy, cz] = placement.center;
  const z = cz + placement.normal * 1.9; // in front of balconies and sills
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(FLAT_W, FH - 0.1, 3.8)), []);
  return (
    <group>
      <mesh position={[cx, cy, cz + placement.normal * 0.5]} renderOrder={10}>
        <boxGeometry args={[FLAT_W, FH - 0.1, 3.8]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.28} depthWrite={false} />
      </mesh>
      <lineSegments position={[cx, cy, cz + placement.normal * 0.5]} geometry={edges} renderOrder={11}>
        <lineBasicMaterial color="#22d3ee" />
      </lineSegments>
      <Html position={[cx, cy + FH * 0.5, z]} center occlude>
        <span className="whitespace-nowrap rounded bg-cyan-500 px-2 py-0.5 text-xs font-bold text-white shadow">
          {code}
        </span>
      </Html>
    </group>
  );
}

interface Wing18ModelProps {
  wing: Wing;
  mode: Mode;
  highlighted?: boolean;
  showLabel?: boolean;
  onSelect?: (wing: Wing) => void;
  /** Flat to outline on the facade. */
  highlightFlat?: { code: string; placement: FlatPlacement };
}

export function Wing18Model({ wing, mode, highlighted = false, showLabel = false, onSelect, highlightFlat }: Wing18ModelProps) {
  const m = useMaterials(mode, highlighted, wing.floors);
  const height = wing.floors * FH;
  const [x, z] = wing.position;
  const night = mode === "night";

  return (
    <group
      position={[x, 0, z]}
      rotation={[0, wing.rotation, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(wing);
      }}
    >
      {SIDES.map((side) => (
        <group key={side}>
          <TowerBody side={side} floors={wing.floors} m={m} />
          <Box args={[TOWER_W + 0.4, 0.6, DEPTH + 0.4]} position={[side * TOWER_X, 0.3, 0]} material={m.plinth} />
          {/* identical facade on the front (+z) and back (-z); rotating the back by π mirrors x, so flip side */}
          {[
            { z: FRONT, rot: 0, s: side, seed: 0 },
            { z: -FRONT, rot: Math.PI, s: (-side) as -1 | 1, seed: 97 },
          ].map((f) => (
            <group key={f.seed} position={[0, 0, f.z]} rotation={[0, f.rot, 0]}>
              <WindowBay side={f.s} floors={wing.floors} m={m} />
              <FacadeColumns side={f.s} floors={wing.floors} faceSeed={f.seed} m={m} />
              <OuterBalconyColumn side={f.s} floors={wing.floors} faceSeed={f.seed + 3} m={m} />
              {CORNICE_FLOORS.filter((fl) => fl < wing.floors).map((fl) =>
                [
                  [CORE_W / 2, LOGGIA_X - LOGGIA_W / 2],
                  // stops short of the outer balcony column, which reads as its own bay
                  [LOGGIA_X + LOGGIA_W / 2, OUTER_BAL_X - OUTER_BAL_W / 2 - 0.25],
                ].map(([a, b]) => (
                  <Box
                    key={`${fl}-${a}`}
                    args={[b - a, 0.35, 0.9]}
                    position={[(f.s * (a + b)) / 2, fl * FH - 0.05, 0.3]}
                    material={m.trim}
                  />
                )),
              )}
            </group>
          ))}
          <Roof side={side} floors={wing.floors} pediment={side === pedimentSide(wing.number)} m={m} />
          {night && (
            <pointLight position={[side * BAY_X, 0.8, FRONT + 2]} intensity={60} distance={32} decay={1.2} color="#ffc27a" />
          )}
        </group>
      ))}

      {/* recessed core between the towers, with small stair-landing windows */}
      <Box
        args={[CORE_W, height + 0.6, CORE_FRONT + FRONT]}
        position={[0, (height + 0.6) / 2, (CORE_FRONT - FRONT) / 2]}
        material={m.core}
      />
      {Array.from({ length: wing.floors }, (_, floor) =>
        floor < 3 ? null : (
          <Plane
            key={floor}
            args={[0.9, 1.1]}
            position={[0, floor * FH + 1.6, CORE_FRONT + 0.02]}
            material={isLit(floor * 23) ? m.glassLit : m.glass}
          />
        ),
      )}

      <Portal wing={wing} mode={mode} m={m} />
      {highlightFlat && <FlatHighlight code={highlightFlat.code} placement={highlightFlat.placement} />}

      {showLabel && (
        <Html position={[0, height + 6, 0]} center distanceFactor={60} occlude>
          <span
            className={`whitespace-nowrap rounded px-2 py-0.5 text-xs font-semibold ${
              night ? "bg-black/60 text-white" : "bg-white/80 text-stone-900"
            }`}
          >
            {wing.name}
          </span>
        </Html>
      )}
    </group>
  );
}
