"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import type { Wing } from "@/data/wings";
import type { Series } from "@/data/flats";
import { canvasTexture } from "./textures";
import { Box, Plane, Rosette, Wing18Portal } from "./Wing18Portal";

type Mode = "day" | "night";

/* ==========================================================================
 * Wing 16/17 — constants (context §9.10)
 *
 * Wing 17 is the EAST half of the South-campus 16/17 twin; Wing 16 is its
 * exact mirror about the party wall (x = −24 in world space). The model is
 * authored in Wing-16's local orientation (west → east) and Wing 17 is
 * mirrored with `fx = -1` at render time (§9.12).
 *
 * Local x runs west→east across one wing; the wing centre (x = 0) sits at
 * the tower pair midpoint.  The whole wing is later rotated by
 * `rotation: Math.PI` (180° about Y) so that the local +z front faces
 * plan-north (the courtyard).
 *
 * Module layout (authored west→east for Wing 16):
 *   series-6  M1    seam  M2    seam  M3   series-3
 *    4 m      10   1.5   10    1.5    10     3 m
 *  −20 −16  −16 −6  |  −4.5 +5.5  |  +7 +17  +17 +20
 *
 *  4.0 + 3×10.0 + 2×1.5 + 3.0 = 40.0 m ✓ (PAIR_SPAN_1617)
 * ========================================================================== */

const FH = 3.2;              // typical floor-to-floor
const TOP_FH = 4.0;          // arch storey (top floor)
const FLOORS = 20;           // G+19 (placeholder, ±1)
const DEPTH = 20;
const FRONT = DEPTH / 2;     // 10
const WING_W = 40.0;         // wing width, east–west
const MODULE_W = 10.0;       // 3 per face
const SEAM_W = 1.5;          // recessed seam between modules
const SEAM_DEPTH = 2.4;      // how far the seam recesses (m)
const SERIES6_W = 4.0;       // flat connector at the party wall
const SERIES3_W = 3.0;       // flat east end block

/* Per-module bay layout (module-local x, module centre = 0):
 *   Bay B (outer) | Bay A (inner) | Corner Pier (outer edge)
 *       −2.825      |    +1.525     |    +4.35
 *   spans [−5,−0.65] | [−0.65, 3.7] | [3.7, 5.0]
 * (10.0 = 4.35 + 1.3 + 4.35)
 */
const PIER_W = 1.3;
const BAY_W = 4.35;          // (10.0 − 1.3) / 2
const LOCAL_BAY_B_X = -2.825;  // outer bay centre (west side of module)
const LOCAL_BAY_A_X = 1.525;   // inner bay centre (east side of module)
const LOCAL_PIER_X = 4.35;     // pier centre (east edge of module)

const MODULE_CX = [-11, 0.5, 12] as const;   // module centres (authored)
const SEAM_CX = [-5.25, 6.25] as const;      // seam centres between modules
const SERIES6_CX = -18;                        // series-6 connector centre
const SERIES3_CX = 18.5;                       // series-3 end-block centre

const ARCH_R = 1.75;          // inner radius of the arch moulding
const ARCH_SPRING = 1.15;     // height of the moulding above the spring line
const ARCH_BAND = 0.22;       // thickness of the moulding band
const ROSETTE_D = 0.85;       // rosette diameter

const PEDIMENT_W = 9.1;       // 2 bays + 0.2 overhang each side
const PEDIMENT_H = 3.0;       // gable rise above the cornice
const PEDIMENT_D = 1.2;       // pediment projection from facade
const DENTILS = 14;           // dentil blocks along the cornice

const CORNICE_FLOORS = [4, 9, 14];
const RAIL_H = 1.05;          // balcony railing height
const BAL_DEPTH = 1.2;        // balcony slab projection
const SCREEN_W = 1.8;         // privacy screen width
const SCREEN_H = 2.2;         // privacy screen height
const ROOF_RAIL_H = 1.1;      // rooftop safety railing height
const BODY_H = (FLOORS - 1) * FH + TOP_FH; // 64.8 m — roof parapet line

// ---------- canvas textures ----------

/** Black wrought-iron railing as an alpha-tested plane (top rail, bottom rail, bars ~12 cm apart). */
const railingMaterials = new Map<number, THREE.MeshStandardMaterial>();

function railingMaterial(width: number): THREE.MeshStandardMaterial {
  let material = railingMaterials.get(width);
  if (!material) {
    const bars = Math.max(6, Math.round(width * 8));
    const map = canvasTexture(`rail-17-${width}`, 512, 128, (ctx) => {
      ctx.fillStyle = "#141414";
      ctx.fillRect(0, 0, 512, 10);       // top rail
      ctx.fillRect(0, 114, 512, 8);      // bottom rail
      ctx.fillRect(0, 0, 8, 128);        // left post
      ctx.fillRect(504, 0, 8, 128);      // right post
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

/** Louvred privacy screen texture: horizontal slats, colour #b09a6a (context §9.11). */
const screenMaterials = new Map<string, THREE.MeshStandardMaterial>();

function screenMaterial(seed: number, night = false): THREE.MeshStandardMaterial {
  const key = `${night ? "n" : "d"}-${seed}`;
  let material = screenMaterials.get(key);
  if (!material) {
    const map = canvasTexture(`screen-17-${key}`, 256, 512, (ctx) => {
      ctx.fillStyle = night ? "#8c8058" : "#b09a6a";
      ctx.fillRect(0, 0, 256, 512);
      ctx.strokeStyle = night ? "#7a6f48" : "#8a7d55";
      ctx.lineWidth = 14;
      for (let y = 30; y < 480; y += 34) {
        ctx.beginPath();
        ctx.moveTo(6, y);
        ctx.lineTo(250, y);
        ctx.stroke();
      }
    });
    material = new THREE.MeshStandardMaterial({
      map,
      roughness: 0.9,
      metalness: 0.1,
    });
    screenMaterials.set(key, material);
  }
  return material;
}

// ---------- materials ----------

type MaterialKey =
  | "stucco" | "stuccoDark" | "trim" | "trimDouble" | "plinth"
  | "slab" | "glass" | "glassLit" | "recess" | "frame"
  | "screen" | "metal" | "roofRail";

type Materials = Record<MaterialKey, THREE.MeshStandardMaterial>;

function useMaterials(mode: Mode, highlighted: boolean): Materials {
  return useMemo((): Materials => {
    const night = mode === "night";
    return {
      stucco: new THREE.MeshStandardMaterial({
        color: highlighted ? "#a8d5b5" : "#dbc6a2",
        roughness: 0.92,
      }),
      stuccoDark: new THREE.MeshStandardMaterial({
        color: "#b39a74",
        roughness: 0.95,
      }),
      trim: new THREE.MeshStandardMaterial({
        color: "#e8dcc2",
        roughness: 0.85,
      }),
      trimDouble: new THREE.MeshStandardMaterial({
        color: "#e8dcc2",
        roughness: 0.85,
        side: THREE.DoubleSide,
      }),
      plinth: new THREE.MeshStandardMaterial({
        color: "#b3a284",
        roughness: 0.95,
      }),
      slab: new THREE.MeshStandardMaterial({
        color: "#e4d5b7",
        roughness: 0.9,
      }),
      glass: new THREE.MeshStandardMaterial({
        color: night ? "#1a2230" : "#46586a",
        roughness: 0.12,
        metalness: 0.55,
        transparent: true,
        opacity: 0.85,
      }),
      glassLit: new THREE.MeshStandardMaterial({
        color: night ? "#ffd9a0" : "#46586a",
        emissive: night ? "#ffae52" : "#000000",
        emissiveIntensity: night ? 1.3 : 0,
        roughness: 0.2,
        metalness: night ? 0 : 0.55,
        transparent: true,
        opacity: 0.85,
      }),
      recess: new THREE.MeshStandardMaterial({
        color: night ? "#2a2520" : "#6f6555",
        roughness: 1,
      }),
      frame: new THREE.MeshStandardMaterial({
        color: "#f5f1e8",
        roughness: 0.6,
      }),
      screen: screenMaterial(0, night),
      metal: new THREE.MeshStandardMaterial({
        color: "#141414",
        roughness: 0.5,
        metalness: 0.4,
      }),
      roofRail: new THREE.MeshStandardMaterial({
        color: "#3a3a3a",
        roughness: 0.6,
        metalness: 0.5,
      }),
    };
  }, [mode, highlighted]);
}

// ---------- helpers ----------

/** Pseudo-random but stable per window, so the same flats are lit every render. */
function isLit(seed: number): boolean {
  const v = Math.sin(seed * 127.1) * 43758.5453;
  return v - Math.floor(v) < 0.6;
}

/**
 * U-shaped arch moulding (open at the bottom) — the arched surrounds on the bays.
 * Returns a Shape in the X/Y plane; extrude along Z for depth.
 */
function archMouldingShape(innerHalf: number, spring: number, thickness: number): THREE.Shape {
  const outer = innerHalf + thickness;
  const s = new THREE.Shape();
  s.moveTo(-outer, 0);
  s.lineTo(-outer, spring);
  s.absarc(0, spring, outer, Math.PI, 0, true);  // outer arc (clockwise, up)
  s.lineTo(outer, 0);
  s.lineTo(innerHalf, 0);
  s.lineTo(innerHalf, spring);
  s.absarc(0, spring, innerHalf, 0, Math.PI, false); // inner arc (counter-clockwise, up)
  s.lineTo(-innerHalf, 0);
  s.closePath();
  return s;
}

// ---------- window primitive ----------

/**
 * White-framed window with a centre mullion, transom and a projecting sill,
 * as in the reference photos. Face-local coords (face plane at z, facing +face_z).
 */
function FramedWindow({
  x, y0, z, width, height = 2.0, lit, face, m,
}: {
  x: number; y0: number; z: number; width: number;
  height?: number; lit: boolean; face: 1 | -1; m: Materials;
}) {
  const yc = y0 + height / 2;
  const transomY = y0 + height * 0.22;
  const rotY = face === 1 ? 0 : Math.PI;
  return (
    <group>
      <Plane args={[width, height]} position={[x, yc, z + face * 0.01]} material={lit ? m.glassLit : m.glass} rotation={[0, rotY, 0]} />
      <Box args={[width + 0.24, 0.12, 0.08]} position={[x, yc + height / 2, z + face * 0.04]} material={m.frame} shadow={false} />
      <Box args={[width + 0.24, 0.12, 0.08]} position={[x, yc - height / 2, z + face * 0.04]} material={m.frame} shadow={false} />
      <Box args={[0.12, height, 0.08]} position={[x - width / 2, yc, z + face * 0.04]} material={m.frame} shadow={false} />
      <Box args={[0.12, height, 0.08]} position={[x + width / 2, yc, z + face * 0.04]} material={m.frame} shadow={false} />
      <Box args={[0.07, height, 0.06]} position={[x, yc, z + face * 0.04]} material={m.frame} shadow={false} />
      <Box args={[width, 0.07, 0.06]} position={[x, transomY, z + face * 0.04]} material={m.frame} shadow={false} />
      <Box args={[width, 0.07, 0.35]} position={[x, y0 + 0.43, z + face * 0.17]} material={m.trim} shadow={false} />
    </group>
  );
}

// ---------- massing ----------

/** The solid 10×20×BODY_H tower mass for one module. */
function ModuleMass({ cx, fx, m }: { cx: number; fx: number; m: Materials }) {
  return (
    <Box args={[MODULE_W, BODY_H, DEPTH]} position={[fx * cx, BODY_H / 2, 0]} material={m.stucco} />
  );
}

/** The 1.5 m recessed seam between two adjacent modules. */
function SeamFill({ cx, fx, m }: { cx: number; fx: number; m: Materials }) {
  const x = fx * cx;
  return (
    <group>
      <Box args={[SEAM_W, BODY_H - FH, SEAM_DEPTH]} position={[x, (BODY_H - FH) / 2 + FH, 0]} material={m.stuccoDark} />
      {Array.from({ length: FLOORS }, (_, floor) => {
        if (floor < 1) return null;
        return (
          <Box key={floor} args={[SEAM_W, 0.15, SEAM_DEPTH]} position={[x, floor * FH + FH / 2, 0]} material={m.slab} />
        );
      })}
    </group>
  );
}

/** Arch moulding geometry shared by all bays (created once). */
const archMouldingGeo = new THREE.ExtrudeGeometry(
  archMouldingShape(ARCH_R, ARCH_SPRING, ARCH_BAND),
  { depth: 0.16, bevelEnabled: false },
);

/**
 * Typical Bay A (outer bay per context §9.3): 4.35 m arched opening with a
 * French window and black railing on every floor. No balcony projection.
 */
function TypicalBayA({
  x, faceZ, face, floors, seed, m,
}: {
  x: number; faceZ: number; face: 1 | -1; floors: number;
  seed: number; m: Materials;
}) {
  const height = floors * FH;
  const z = faceZ;
  const winW = 2.2;
  const winH = 2.0;
  const rotY = face === 1 ? 0 : Math.PI;

  return (
    <group position={[x, 0, 0]}>
      {/* bay panel behind the windows — set back 0.15 m from face */}
      <Box args={[BAY_W, height + 1.2, 0.3]} position={[0, (height + 1.2) / 2, z - face * 0.15]} material={m.stucco} />
      {Array.from({ length: floors + 1 }, (_, floor) => {
        if (floor < 1 || floor >= floors - 1) return null;
        const lit = isLit(floor * 7 + face * 3 + seed);
        return (
          <group key={floor}>
            <FramedWindow x={0} y0={floor * FH} z={z + face * 0.01} width={winW} height={winH} lit={lit} face={face} m={m} />
            <Plane args={[winW + 0.4, RAIL_H]} position={[0, floor * FH + 1.05, z + face * BAL_DEPTH]} material={railingMaterial(winW + 0.4)} rotation={[0, rotY, 0]} />
          </group>
        );
      })}
      {/* top arch moulding */}
      <mesh position={[0, BODY_H + ARCH_SPRING, z + face * 0.02]} geometry={archMouldingGeo} material={m.trim} rotation={[0, rotY, 0]} castShadow />
    </group>
  );
}

/** Horizontal band courses at floors [4, 9, 14] (context §9.9, item 4). */
function BandCourses({ cx, fx, face, m }: { cx: number; fx: number; face: 1 | -1; m: Materials }) {
  const x = fx * cx;
  return (
    <>
      {CORNICE_FLOORS.filter((fl) => fl < FLOORS).map((fl) => (
        <Box
          key={fl}
          args={[MODULE_W, 0.35, 0.8]}
          position={[x, fl * FH - 0.05, face * (FRONT - 0.4)]}
          material={m.trim}
        />
      ))}
    </>
  );
}

/** Arch storey at the top of a module: two arched openings per face + rosettes. */
function ArchStorey({ cx, fx, face, m }: { cx: number; fx: number; face: 1 | -1; m: Materials }) {
  const x = fx * cx;
  const bays = [LOCAL_BAY_B_X, LOCAL_BAY_A_X];
  const rotY = face === 1 ? 0 : Math.PI;
  const faceZ = face * (FRONT - 0.02);

  return (
    <group position={[x, 0, 0]}>
      {bays.map((localX, i) => {
        const bx = face === 1 ? localX : -localX;
        return (
          <group key={i} position={[bx, BODY_H, 0]}>
            <mesh position={[0, ARCH_SPRING, faceZ + face * 0.02]} geometry={archMouldingGeo} material={m.trim} rotation={[0, rotY, 0]} castShadow />
            <Rosette position={[0, BODY_H + ARCH_SPRING + ARCH_R, faceZ + face * 0.05]} size={ROSETTE_D} />
            <Plane args={[BAY_W - 0.4, 1.5]} position={[0, BODY_H + 2.2, faceZ + face * 0.01]} material={m.recess} rotation={[0, rotY, 0]} />
          </group>
        );
      })}
    </group>
  );
}

/** Triangular pediment gable over one module's two arch bays (9.1 m wide, 3.0 m rise). */
function Pediment({ cx, fx, face, m }: { cx: number; fx: number; face: 1 | -1; m: Materials }) {
  const x = fx * cx;
  const gableShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-PEDIMENT_W / 2, 0);
    s.lineTo(PEDIMENT_W / 2, 0);
    s.lineTo(0, PEDIMENT_H);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: PEDIMENT_D, bevelEnabled: false });
  }, []);
  const faceZ = face * FRONT;

  return (
    <group position={[x, 0, 0]}>
      <Box args={[PEDIMENT_W + 0.4, 0.3, 0.8]} position={[0, BODY_H + 0.15, faceZ - face * 0.4]} material={m.trim} />
      <Box args={[PEDIMENT_W + 0.6, 0.35, 1.0]} position={[0, BODY_H + 0.3, faceZ - face * 0.5]} material={m.trim} />
      {Array.from({ length: DENTILS }, (_, i) => (
        <Box
          key={i}
          args={[0.25, 0.35, 0.25]}
          position={[-PEDIMENT_W / 2 + 0.4 + (i * (PEDIMENT_W - 0.8) / (DENTILS - 1)), BODY_H + 0.18, faceZ - face * 0.35]}
          material={m.trim} shadow={false}
        />
      ))}
      <mesh position={[0, BODY_H + 0.3, faceZ]} geometry={gableShape} material={m.trim} rotation={[0, face === 1 ? 0 : Math.PI, 0]} castShadow />
    </group>
  );
}

/**
 * Typical Bay B (inner bay per context §9.3): 4.35 m opening with cantilevered
 * balcony, louvred privacy screen and planter on odd floors.
 */
function TypicalBayB({
  x, faceZ, face, floors, seed, m,
}: {
  x: number; faceZ: number; face: 1 | -1; floors: number;
  seed: number; m: Materials;
}) {
  const height = floors * FH;
  const z = faceZ;
  const winW = 2.2;
  const winH = 2.0;
  const rotY = face === 1 ? 0 : Math.PI;

  return (
    <group position={[x, 0, 0]}>
      <Box args={[BAY_W, height + 1.2, 0.3]} position={[0, (height + 1.2) / 2, z - face * 0.15]} material={m.stucco} />
      {Array.from({ length: floors + 1 }, (_, floor) => {
        if (floor < 1 || floor >= floors - 1) return null;
        const lit = isLit(floor * 11 + face * 5 + seed);
        const yb = floor * FH + 0.43;
        return (
          <group key={floor}>
            <FramedWindow x={0} y0={floor * FH} z={z + face * 0.01} width={winW} height={winH} lit={lit} face={face} m={m} />
            <Box args={[BAY_W - 0.3, 0.22, BAL_DEPTH]} position={[0, yb - 0.11, face * (BAL_DEPTH / 2)]} material={m.slab} />
            <Plane args={[BAY_W - 0.5, RAIL_H]} position={[0, yb + RAIL_H / 2, face * BAL_DEPTH]} material={railingMaterial(BAY_W - 0.5)} rotation={[0, rotY, 0]} />
            {floor % 2 === 1 && (
              <Box args={[SCREEN_W, SCREEN_H, 0.06]} position={[0, floor * FH + 1.4, face * 0.06]} material={m.screen} rotation={[0, rotY, 0]} />
            )}
          </group>
        );
      })}
      {/* top arch moulding */}
      <mesh position={[0, BODY_H + ARCH_SPRING, z + face * 0.02]} geometry={archMouldingGeo} material={m.trim} rotation={[0, rotY, 0]} castShadow />
    </group>
  );
}

/** Corner pier: 1.3 m blank stucco pier with small windows on odd floors. */
function CornerPier({
  x, faceZ, face, floors, seed, m,
}: {
  x: number; faceZ: number; face: 1 | -1; floors: number;
  seed: number; m: Materials;
}) {
  const height = floors * FH;
  const rotY = face === 1 ? 0 : Math.PI;
  return (
    <group position={[x, 0, 0]}>
      <Box args={[PIER_W, height, 0.4]} position={[0, height / 2, faceZ - face * 0.2]} material={m.stucco} />
      {Array.from({ length: floors - 2 }, (_, floor) => {
        if (floor < 1 || floor >= floors - 1 || floor % 2 === 0) return null;
        const lit = isLit(floor * 13 + face * 7 + seed);
        return (
          <Plane key={floor} args={[0.8, 1.2]} position={[0, floor * FH + FH / 2, faceZ + face * 0.01]} material={lit ? m.glassLit : m.glass} rotation={[0, rotY, 0]} />
        );
      })}
    </group>
  );
}

/** Thin rooftop safety railing: 1.1 m high, posts every 1.6 m, around a module roof. */
const roofRailMat = new THREE.MeshStandardMaterial({ color: "#3a3a3a", metalness: 0.5, roughness: 0.6 });

function RoofRailing({ cx, fx }: { cx: number; fx: number }) {
  const x = fx * cx;
  const halfW = MODULE_W / 2 - 0.15;
  const halfD = DEPTH / 2 - 0.15;
  const y = BODY_H + 0.3 + ROOF_RAIL_H;
  const nPosts = Math.floor(MODULE_W / 1.6) + 1;

  return (
    <group position={[x, y, 0]}>
      {[-halfD, halfD].map((d, i) => (
        <Box key={`hr-${i}`} args={[MODULE_W - 0.3, 0.05, 0.05]} position={[0, 0, d]} material={roofRailMat} />
      ))}
      {[-halfW, halfW].map((w, i) => (
        <Box key={`vr-${i}`} args={[0.05, 0.05, DEPTH - 0.3]} position={[w, 0, 0]} material={roofRailMat} />
      ))}
      {Array.from({ length: nPosts }, (_, i) => {
        const px = -halfW + (i * (MODULE_W - 0.3) / (nPosts - 1));
        return <Box key={`pf-${i}`} args={[0.05, ROOF_RAIL_H, 0.05]} position={[px, -ROOF_RAIL_H / 2, -halfD]} material={roofRailMat} />;
      })}
      {Array.from({ length: nPosts }, (_, i) => {
        const px = -halfW + (i * (MODULE_W - 0.3) / (nPosts - 1));
        return <Box key={`pb-${i}`} args={[0.05, ROOF_RAIL_H, 0.05]} position={[px, -ROOF_RAIL_H / 2, halfD]} material={roofRailMat} />;
      })}
    </group>
  );
}

/** Two finial rods at the gable apex. */
function Finials({ cx, fx, face, m }: { cx: number; fx: number; face: 1 | -1; m: Materials }) {
  const x = fx * cx;
  const apex = BODY_H + 0.3 + PEDIMENT_H;
  const z = face * (FRONT - 2);
  return (
    <group position={[x, 0, 0]}>
      {[-0.8, 0.8].map((dx, i) => (
        <mesh key={i} position={[dx, apex, z]} material={m.metal}>
          <cylinderGeometry args={[0.04, 0.04, 1.2, 6]} />
        </mesh>
      ))}
    </group>
  );
}

/** Flat-roofed connector bay at the party wall: 4 m wide, 2.6 m set back, no pediment. */
function Series6Bay({ fx, floors, m }: { fx: number; floors: number; m: Materials }) {
  const height = floors * FH;
  const x = fx * SERIES6_CX;
  return (
    <group position={[x, 0, 0]}>
      <Box args={[SERIES6_W, height, 2.0]} position={[0, height / 2, 0]} material={m.stucco} />
      <Box args={[SERIES6_W, 0.6, 2.0]} position={[0, 0.3, 0]} material={m.plinth} />
      {Array.from({ length: floors }, (_, floor) => {
        if (floor < 1) return null;
        const lit = isLit(floor * 17 + 99);
        return <Plane key={floor} args={[1.4, 1.6]} position={[0, floor * FH + FH / 2, 0.02]} material={lit ? m.glassLit : m.glass} />;
      })}
      <Box args={[SERIES6_W, 0.3, 0.8]} position={[0, height + 0.15, 0]} material={m.trim} />
      <Box args={[SERIES6_W, 0.9, 1.2]} position={[0, height + 0.6, 0]} material={m.stucco} />
    </group>
  );
}

/** Flat-roofed end block: 3 m wide, no pediment. */
function Series3Block({ fx, floors, m }: { fx: number; floors: number; m: Materials }) {
  const height = floors * FH;
  const x = fx * SERIES3_CX;
  return (
    <group position={[x, 0, 0]}>
      <Box args={[SERIES3_W, height, DEPTH]} position={[0, height / 2, 0]} material={m.stucco} />
      {[1, -1].map((faceDir) => (
        <Plane
          key={faceDir}
          args={[1.6, 2.0]}
          position={[0, BODY_H - 8, faceDir * (FRONT + 0.02)]}
          material={m.glassLit}
          rotation={[0, faceDir === 1 ? 0 : Math.PI, 0]}
        />
      ))}
      <Box args={[SERIES3_W, 0.3, 0.8]} position={[0, height + 0.15, 0]} material={m.trim} />
      <Box args={[SERIES3_W, 0.9, 0.9]} position={[0, height + 0.6, 0]} material={m.stucco} />
    </group>
  );
}

// ---------- flat placement ----------

/** Where a flat sits on the Wing-17 model: centre, outward normal, and approach axis. */
export interface FlatPlacement {
  /** Facade centre of the flat on its floor. */
  center: [number, number, number];
  /** Outward direction from the facade (+z front/north, -z back/south). */
  normal: 1 | -1;
  /** "z" = long-face flat; "x" = end-block flat (camera approaches along x). */
  axis?: "x" | "z";
}

/** Series-aware flat placement (context §8.3). `series` selects the module, bay and face. */
export function wing17FlatPlacement(floor: number, series: Series, wingNumber = 17): FlatPlacement {
  const fx = wingNumber === 17 ? -1 : 1;
  const mx = (v: number) => v * fx;
  const cy = floor * FH + FH / 2;

  switch (series) {
    case 1: // north face, M2 (inner bay, near pier)
      return { center: [mx(MODULE_CX[1] + LOCAL_BAY_A_X), cy, FRONT + 0.1], normal: 1, axis: "z" };
    case 2: // north face, M1 (outer bay)
      return { center: [mx(MODULE_CX[0] + LOCAL_BAY_B_X), cy, FRONT + 0.1], normal: 1, axis: "z" };
    case 3: // east end block
      return { center: [mx(SERIES3_CX), cy, 0], normal: 1, axis: "x" };
    case 4: // south face, M1 (outer bay)
      return { center: [mx(MODULE_CX[0] + LOCAL_BAY_B_X), cy, -FRONT - 0.1], normal: -1, axis: "z" };
    case 5: // south face, M2 (inner bay, near pier)
      return { center: [mx(MODULE_CX[1] + LOCAL_BAY_A_X), cy, -FRONT - 0.1], normal: -1, axis: "z" };
    case 6: // recessed party-wall connector
      return { center: [mx(SERIES6_CX), cy, 0], normal: 1, axis: "z" };
    default:
      return { center: [0, cy, FRONT + 0.1], normal: 1, axis: "z" };
  }
}

/** Glowing outline + translucent panel over one flat's facade, with a floating flat-number tag. */
function FlatHighlight({ code, placement }: { code: string; placement: FlatPlacement }) {
  const [cx, cy, cz] = placement.center;
  const z = cz + placement.normal * 1.9;
  const axis = placement.axis ?? "z";
  const width = axis === "x" ? SERIES3_W : MODULE_W / 2;
  const height = FH - 0.1;
  const boxDepth = axis === "x" ? SERIES3_W * 0.5 : 3.8;
  const boxWidth = axis === "x" ? SERIES3_W * 0.8 : width;
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(boxWidth, height, boxDepth)), [boxWidth, height, boxDepth]);

  return (
    <group>
      <mesh position={[cx, cy, cz + placement.normal * 0.5]} renderOrder={10}>
        <boxGeometry args={[boxWidth, height, boxDepth]} />
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

interface Wing17ModelProps {
  wing: Wing;
  mode: Mode;
  highlighted?: boolean;
  showLabel?: boolean;
  onSelect?: (wing: Wing) => void;
  /** Flat to outline on the facade. */
  highlightFlat?: { code: string; placement: FlatPlacement };
}

/**
 * Wing 17: three gabled modules per face, each with two arched bays and a
 * triangular pediment; a set-back series-6 connector at the party wall and a
 * flat series-3 end block. Wing 16 is the same component mirrored (§9.12).
 */
export function Wing17Model({ wing, mode, highlighted = false, showLabel = false, onSelect, highlightFlat }: Wing17ModelProps) {
  const m = useMaterials(mode, highlighted);
  const height = wing.floors * FH;
  const [x, z] = wing.position;
  const night = mode === "night";

  // fx = -1 mirrors the authored (Wing-16) geometry for Wing 17 (§9.12).
  const fx: 1 | -1 = wing.number === 17 ? -1 : 1;

  // Two faces per tower: front (north) and back (south)
  const faces: { face: 1 | -1; seed: number }[] = [
    { face: 1, seed: 0 },   // front (courtyard / north)
    { face: -1, seed: 97 },  // back  (south)
  ];

  return (
    <group
      position={[x, 0, z]}
      rotation={[0, wing.rotation, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(wing);
      }}
    >
      {/* --- three modules + two seams + end caps --- */}
      {MODULE_CX.map((cx, i) => (
        <group key={`mod-${i}`}>
          {faces.map((f) => {
            const faceZ = f.face * (FRONT - 0.02);
            const bayBx = fx * (cx + f.face * LOCAL_BAY_B_X);
            const bayAx = fx * (cx + f.face * LOCAL_BAY_A_X);
            const pierX = fx * (cx + f.face * LOCAL_PIER_X);
            return (
              <group key={`face-${f.face}`}>
                <ModuleMass cx={cx} fx={fx} m={m} />
                <BandCourses cx={cx} fx={fx} face={f.face} m={m} />
                <TypicalBayA x={bayBx} faceZ={faceZ} face={f.face} floors={wing.floors} seed={f.seed} m={m} />
                <TypicalBayB x={bayAx} faceZ={faceZ} face={f.face} floors={wing.floors} seed={f.seed + 3} m={m} />
                <CornerPier x={pierX} faceZ={faceZ} face={f.face} floors={wing.floors} seed={f.seed + 7} m={m} />
                <ArchStorey cx={cx} fx={fx} face={f.face} m={m} />
                <Pediment cx={cx} fx={fx} face={f.face} m={m} />
                <RoofRailing cx={cx} fx={fx} />
                <Finials cx={cx} fx={fx} face={f.face} m={m} />
              </group>
            );
          })}
        </group>
      ))}

      {/* seams between modules */}
      {SEAM_CX.map((sx, i) => (
        <SeamFill key={`seam-${i}`} cx={sx * fx} fx={1} m={m} />
      ))}

      {/* end caps */}
      <Series6Bay fx={fx} floors={wing.floors} m={m} />
      <Series3Block fx={fx} floors={wing.floors} m={m} />

      {/* ground-floor plinth around the full wing width */}
      <Box args={[WING_W, 0.6, DEPTH]} position={[0, 0.3, 0]} material={m.plinth} />

      {/* entrance portal recessed into the series-6 bay */}
      <group position={[fx * SERIES6_CX, 0, 0]}>
        <Wing18Portal wing={wing} mode={mode} front={7.4} coreFront={7.4} />
      </group>

      {night && (
        <pointLight position={[0, 2, FRONT + 2]} intensity={60} distance={32} decay={1.2} color="#ffc27a" />
      )}

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
