"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { WING_WIDTH, WING_DEPTH, type Wing } from "@/data/wings";
import { GRASS } from "./palette";

interface BuildingProps {
  wing: Wing;
  mode: "day" | "night";
  highlighted?: boolean;
  onSelect?: (wing: Wing) => void;
}

const FLOOR_HEIGHT = 3.2;
const BALCONY_DEPTH = 1.1;
const BALCONY_HEIGHT = 1.9;
const BAY_GAP = 3; // narrow full-height notch between the two towers, as seen in the Wing-18 night photo
const ENTRANCE_HEIGHT = FLOOR_HEIGHT * 3;
const GROUND_FLOORS_NO_BALCONY = 1;

/** One projecting balcony with a railing, on the given face of a tower bay. */
function Balcony({
  floor,
  bayWidth,
  mode,
  face,
}: {
  floor: number;
  bayWidth: number;
  mode: "day" | "night";
  face: "front" | "left" | "right";
}) {
  const railColor = "#2b2b2b";
  const glassColor = mode === "night" ? "#ffce7a" : "#bcd7e6";
  const glassEmissive = mode === "night" ? "#ffce7a" : "#000000";
  const y = floor * FLOOR_HEIGHT + FLOOR_HEIGHT / 2;

  // front faces +z (outward), left/right face ±x (outward on the tower's side elevation)
  const rotationY = face === "front" ? 0 : face === "left" ? -Math.PI / 2 : Math.PI / 2;
  const faceDepth = face === "front" ? WING_DEPTH / 2 : WING_WIDTH / 2;
  const span = face === "front" ? bayWidth : WING_DEPTH * 0.4;

  return (
    <group position={[0, y, 0]} rotation={[0, rotationY, 0]}>
      <group position={[0, 0, faceDepth]}>
        <mesh position={[0, -BALCONY_HEIGHT / 2 + 0.1, BALCONY_DEPTH / 2]}>
          <boxGeometry args={[span * 0.86, 0.15, BALCONY_DEPTH]} />
          <meshStandardMaterial color="#d8d2c0" />
        </mesh>
        <mesh position={[0, 0.1, 0.1]}>
          <planeGeometry args={[span * 0.7, BALCONY_HEIGHT * 0.75]} />
          <meshStandardMaterial
            color={glassColor}
            emissive={glassEmissive}
            emissiveIntensity={mode === "night" ? 1.1 : 0}
            transparent
            opacity={0.9}
          />
        </mesh>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} position={[-span * 0.4 + (i * span * 0.8) / 5, -0.35, BALCONY_DEPTH]}>
            <boxGeometry args={[0.06, 1.1, 0.06]} />
            <meshStandardMaterial color={railColor} />
          </mesh>
        ))}
        <mesh position={[0, 0.2, BALCONY_DEPTH]}>
          <boxGeometry args={[span * 0.86, 0.06, 0.06]} />
          <meshStandardMaterial color={railColor} />
        </mesh>
      </group>
    </group>
  );
}

/** Triangular pediment cap on top of a bay, matching the roofline in the reference photos. */
function Pediment({ bayWidth, bayX, height }: { bayWidth: number; bayX: number; height: number }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-bayWidth / 2, 0);
    s.lineTo(bayWidth / 2, 0);
    s.lineTo(0, 2.6);
    s.closePath();
    return s;
  }, [bayWidth]);
  // Shape is drawn in the X/Y plane; extruding along local Z (no rotation
  // needed) makes the extrude axis align with the building's depth (world Z).
  const geometry = useMemo(() => new THREE.ExtrudeGeometry(shape, { depth: WING_DEPTH, bevelEnabled: false }), [shape]);

  return (
    <mesh position={[bayX, height, -WING_DEPTH / 2]} geometry={geometry} castShadow>
      <meshStandardMaterial color="#cfc6ad" />
    </mesh>
  );
}

/**
 * Recessed arched entrance flanked by two arched window bays, with a lit
 * doorway and a numbered plaque above the arch — matches the Wing-18
 * entrance reference photo (lamp posts, arched surround, "18" plaque).
 */
function Entrance({ wing, mode }: { wing: Wing; mode: "day" | "night" }) {
  const lightOn = mode === "night";
  const archGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const w = 1.4;
    const straightH = 2.2;
    shape.moveTo(-w, 0);
    shape.lineTo(-w, straightH);
    shape.absarc(0, straightH, w, Math.PI, 0, true);
    shape.lineTo(w, 0);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);

  return (
    <group position={[0, 0, WING_DEPTH / 2 + 0.05]}>
      {/* entrance podium face */}
      <mesh position={[0, ENTRANCE_HEIGHT / 2, -0.3]}>
        <boxGeometry args={[WING_WIDTH * 1.15, ENTRANCE_HEIGHT, 0.6]} />
        <meshStandardMaterial color="#e4ddc9" />
      </mesh>

      {/* recessed arched doorway, lit from inside */}
      <mesh position={[0, 0, 0.05]} geometry={archGeometry}>
        <meshStandardMaterial
          color={lightOn ? "#ffdca0" : "#cfe3ee"}
          emissive={lightOn ? "#ffb84d" : "#000000"}
          emissiveIntensity={lightOn ? 1.4 : 0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* flanking arched window bays, one each side */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 3.4, 2.4, 0.05]} geometry={archGeometry} scale={0.85}>
          <meshStandardMaterial color={lightOn ? "#2a3344" : "#9fc3d9"} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* numbered plaque above the arch, as on the real Wing-18 entrance */}
      <Html position={[0, 4.4, 0.4]} center distanceFactor={28} occlude>
        <div
          className={`rounded px-3 py-1 text-center text-lg font-bold tracking-wide ${
            mode === "night" ? "bg-black/70 text-amber-200" : "bg-white/90 text-stone-800"
          }`}
        >
          {wing.number}
        </div>
      </Html>

      {/* lamp posts flanking the entrance walkway */}
      {[-2.6, 2.6].map((lx) => (
        <group key={lx} position={[lx, 0, 2]}>
          <mesh position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 1.8, 8]} />
            <meshStandardMaterial color="#2b2b2b" />
          </mesh>
          <mesh position={[0, 1.85, 0]}>
            <sphereGeometry args={[0.18, 12, 12]} />
            <meshStandardMaterial
              color={lightOn ? "#ffd27a" : "#444444"}
              emissive={lightOn ? "#ffb84d" : "#000000"}
              emissiveIntensity={lightOn ? 2 : 0}
            />
          </mesh>
          {lightOn && <pointLight position={[0, 1.85, 0]} intensity={1.4} distance={5} color="#ffb84d" />}
        </group>
      ))}
    </group>
  );
}

export function Building({ wing, mode, highlighted, onSelect }: BuildingProps) {
  const height = wing.floors * FLOOR_HEIGHT;
  const [x, z] = wing.position;
  const facadeColor = highlighted ? "#2f7d53" : mode === "night" ? "#201d2a" : "#e4ddc9";
  const bayWidth = (WING_WIDTH - BAY_GAP) / 2;
  const bayOffsets: [number, "left" | "right"][] = [
    [-bayWidth / 2 - BAY_GAP / 2, "left"],
    [bayWidth / 2 + BAY_GAP / 2, "right"],
  ];

  // Wings in an attached pair (16/17) share the Wing-18 twin-tower footprint: 32 m wide, 20 m deep.
  const paired = wing.number === 16 || wing.number === 17;
  return (
    <group
      position={[x, 0, z]}
      rotation={[0, wing.rotation, 0]}
      scale={paired ? [32 / WING_WIDTH, 1, 20 / WING_DEPTH] : 1}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(wing);
      }}
    >
      {/* twin towers with balconies wrapping the front and outer side faces */}
      {bayOffsets.map(([bayX, outerSide]) => (
        <group key={bayX}>
          <mesh position={[bayX, height / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[bayWidth, height, WING_DEPTH]} />
            <meshStandardMaterial color={facadeColor} roughness={0.85} />
          </mesh>
          <group position={[bayX, 0, 0]}>
            {Array.from({ length: wing.floors - GROUND_FLOORS_NO_BALCONY }, (_, i) => i + GROUND_FLOORS_NO_BALCONY).map(
              (floor) => (
                <group key={floor}>
                  <Balcony floor={floor} bayWidth={bayWidth} mode={mode} face="front" />
                  <Balcony floor={floor} bayWidth={bayWidth} mode={mode} face={outerSide} />
                </group>
              ),
            )}
          </group>
          <Pediment bayWidth={bayWidth} bayX={bayX} height={height} />
        </group>
      ))}

      <Entrance wing={wing} mode={mode} />

      <Html position={[0, height + 5, 0]} center distanceFactor={60} occlude>
        <span
          className={`whitespace-nowrap rounded px-2 py-0.5 text-xs font-semibold ${
            mode === "night" ? "bg-black/60 text-white" : "bg-white/80 text-stone-900"
          }`}
        >
          {wing.name}
        </span>
      </Html>
    </group>
  );
}

export function CourtyardLawn({ position, size = 24 }: { position: [number, number]; size?: number }) {
  const [x, z] = position;
  return (
    <mesh position={[x, 0.05, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[size, 32]} />
      <meshStandardMaterial color={GRASS} roughness={1} />
    </mesh>
  );
}

export function Pool({ position, size = 20 }: { position: [number, number]; size?: number }) {
  const [x, z] = position;
  const geometry = useMemo(() => new THREE.PlaneGeometry(size, size * 0.5), [size]);
  return (
    <mesh position={[x, 0.08, z]} rotation={[-Math.PI / 2, 0, 0]} geometry={geometry} receiveShadow>
      <meshStandardMaterial color="#2aa6c9" metalness={0.3} roughness={0.1} />
    </mesh>
  );
}
