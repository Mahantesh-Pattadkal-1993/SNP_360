"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { Wing } from "@/data/wings";
import { canvasTexture } from "./textures";
import { GRASS } from "./palette";

type Mode = "day" | "night";

// The arched entrance portal, from building entrance.jpg — the shared entrance
// design used by the Wing-18 model and by its Wing-16/17 twin pair.
//
// The portal is authored in its OWN local space, centred on x = 0, with the
// building's front face at z = FRONT and the recessed core face at
// z = CORE_FRONT. The caller places it with a group, so the same component
// serves the detailed Wing-18 model and the generic 16/17 blocks.
export const PORTAL_HALF = 3.6; // half-width of the arched opening
export const ARCH_R = 2.3; // arch radius
export const SPRING = 4.4; // arch springing height
export const PORTAL_TOP = 7.4; // top of the opening
export const PORTAL_FLOOR = 0.6; // raised entrance floor

type Vec3 = [number, number, number];

/** A box primitive with an optional rotation and shadow control. */
export function Box({
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

/** A single-sided plane primitive. */
export function Plane({
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

/** The carved rosette in the arch head. */
export function Rosette({ position, size }: { position: Vec3; size: number }) {
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

interface PortalMaterials {
  trim: THREE.MeshStandardMaterial;
  trimDouble: THREE.MeshStandardMaterial;
  plinth: THREE.MeshStandardMaterial;
  wood: THREE.MeshStandardMaterial;
  paving: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  doorGlass: THREE.MeshStandardMaterial;
  lantern: THREE.MeshStandardMaterial;
  whitePot: THREE.MeshStandardMaterial;
  topiary: THREE.MeshStandardMaterial;
  foliage: THREE.MeshStandardMaterial;
  clayPot: THREE.MeshStandardMaterial;
  lawn: THREE.MeshStandardMaterial;
}

function usePortalMaterials(mode: Mode): PortalMaterials {
  return useMemo((): PortalMaterials => {
    const night = mode === "night";
    return {
      trim: new THREE.MeshStandardMaterial({ color: "#ecdfc4", roughness: 0.85 }),
      trimDouble: new THREE.MeshStandardMaterial({ color: "#ecdfc4", roughness: 0.85, side: THREE.DoubleSide }),
      plinth: new THREE.MeshStandardMaterial({ color: "#b3a284", roughness: 0.95 }),
      wood: new THREE.MeshStandardMaterial({ color: "#a9824f", roughness: 0.8 }),
      paving: new THREE.MeshStandardMaterial({ color: "#cfc6b4", roughness: 1 }),
      metal: new THREE.MeshStandardMaterial({ color: "#1d1b18", roughness: 0.5, metalness: 0.4 }),
      doorGlass: new THREE.MeshStandardMaterial({
        color: night ? "#ffe1ad" : "#8c9aa3",
        emissive: night ? "#ffb35a" : "#000000",
        emissiveIntensity: night ? 1.6 : 0,
        roughness: 0.35,
        metalness: night ? 0 : 0.4,
      }),
      lantern: new THREE.MeshStandardMaterial({
        color: night ? "#ffe2a8" : "#d9d2c0",
        emissive: night ? "#ffb04d" : "#000000",
        emissiveIntensity: night ? 2.5 : 0,
      }),
      whitePot: new THREE.MeshStandardMaterial({ color: "#f1ede4", roughness: 0.7 }),
      topiary: new THREE.MeshStandardMaterial({ color: "#8f7d3b", roughness: 1 }),
      foliage: new THREE.MeshStandardMaterial({ color: "#55702f", roughness: 1 }),
      clayPot: new THREE.MeshStandardMaterial({ color: "#7a3f22", roughness: 0.9 }),
      lawn: new THREE.MeshStandardMaterial({ color: GRASS, roughness: 1 }),
    };
  }, [mode]);
}

export interface Wing18PortalProps {
  wing: Wing;
  mode: Mode;
  /**
   * Z of the building's front face in the portal's local space, and the z of
   * the recessed core face the door is set into. The Wing-18 model has a 4 m
   * core slot recessed 3 m behind the tower faces; the generic 16/17 block
   * has a wider slot, so the caller passes its own values.
   */
  front?: number;
  coreFront?: number;
  /** Width of the entrance lawn laid in front of the portal. */
  lawnWidth?: number;
}

export interface Wing18EntranceBayProps extends Wing18PortalProps {
  /** Colour of the core mass that fills the slot behind the portal. */
  coreColor: string;
  /** Width of the slot between the two towers that the portal is set into. */
  slotWidth: number;
  /** Height of the building the entrance is attached to. */
  buildingHeight: number;
}

/**
 * The full entrance bay: the core mass that fills the slot between the two
 * towers, plus the arched portal set into it.
 *
 * The Wing-18 model builds its own core (with stair-landing windows above),
 * so it uses `Wing18Portal` directly. The generic block — used for Wings
 * 16 and 17 — has a full-depth gap between its towers instead, so it needs
 * this wrapper to fill that gap and give the portal something to sit in.
 */
export function Wing18EntranceBay({
  wing,
  mode,
  front = 10,
  coreFront = 7,
  slotWidth,
  buildingHeight,
  coreColor,
  lawnWidth = 34,
}: Wing18EntranceBayProps) {
  const coreHeight = buildingHeight + 0.6;
  return (
    <group>
      {/* the core mass, filling the slot from the back of the block forward
          to the recessed plane the portal's door sits on */}
      <mesh position={[0, coreHeight / 2, (coreFront - front) / 2]} castShadow receiveShadow>
        <boxGeometry args={[slotWidth, coreHeight, coreFront + front]} />
        <meshStandardMaterial color={coreColor} roughness={0.92} />
      </mesh>
      <Wing18Portal
        wing={wing}
        mode={mode}
        front={front}
        coreFront={coreFront}
        lawnWidth={lawnWidth}
      />
    </group>
  );
}


/**
 * The arched entrance portal from building entrance.jpg: a recessed arched
 * opening with a timber-slatted vault, a rosette over a glazed double door,
 * pilasters and a corbelled entablature carrying the wing number, flanked by
 * lanterns, topiary and potted palms.
 */
export function Wing18Portal({
  wing,
  mode,
  front = 10,
  coreFront = 7,
  lawnWidth = 34,
}: Wing18PortalProps) {
  const night = mode === "night";
  const m = usePortalMaterials(mode);
  const frontWall = useMemo(() => {
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
    return new THREE.ExtrudeGeometry(s, { depth: front + 0.8 - coreFront, bevelEnabled: false });
  }, [front, coreFront]);
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
  const vaultDepth = front + 0.8 - coreFront;
  const doorY = PORTAL_FLOOR + 1.7;

  return (
    <group>
      {/* arched front wall with pilasters */}
      <mesh position={[0, 0, front + 0.8]} geometry={frontWall} material={m.trim} castShadow receiveShadow />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Box args={[1.5, 0.35, 1.5]} position={[s * (ARCH_R + 0.65), SPRING, front + 1.4]} material={m.trim} />
          <Box args={[1.5, 0.5, 1.5]} position={[s * (ARCH_R + 0.65), 0.25, front + 1.4]} material={m.plinth} />
          <Box args={[0.25, SPRING, vaultDepth]} position={[s * (ARCH_R + 0.12), SPRING / 2, coreFront + vaultDepth / 2]} material={m.trim} />
        </group>
      ))}

      {/* entablature with corbels and the wing number */}
      <Box args={[PORTAL_HALF * 2 + 0.6, 1.4, 1.6]} position={[0, PORTAL_TOP + 0.7, front + 1.3]} material={m.trim} />
      <Box args={[PORTAL_HALF * 2 + 1.2, 0.3, 1.9]} position={[0, PORTAL_TOP + 1.55, front + 1.35]} material={m.trim} />
      {Array.from({ length: 5 }, (_, i) => (
        <Box key={i} args={[0.28, 0.5, 0.3]} position={[(i - 2) * 1.2, PORTAL_TOP + 0.3, front + 2.2]} material={m.trim} shadow={false} />
      ))}
      <Plane args={[1.3, 0.65]} position={[0, PORTAL_TOP + 0.95, front + 2.11]} material={numberMaterial} />

      {/* vault with radial timber slats */}
      <mesh position={[0, 0, coreFront]} geometry={vault} material={m.trimDouble} />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (Math.PI * (i + 1)) / 9;
        const r = ARCH_R - 0.18;
        return (
          <Box
            key={i}
            args={[0.12, 0.35, vaultDepth - 0.6]}
            position={[Math.cos(a) * r, SPRING + Math.sin(a) * r, coreFront + vaultDepth / 2 + 0.2]}
            rotation={[0, 0, a - Math.PI / 2]}
            material={m.wood}
            shadow={false}
          />
        );
      })}

      {/* raised floor and steps */}
      <Box args={[ARCH_R * 2, PORTAL_FLOOR, vaultDepth + 1.2]} position={[0, PORTAL_FLOOR / 2, coreFront + (vaultDepth + 1.2) / 2]} material={m.paving} />
      <Box args={[5, 0.4, 0.45]} position={[0, 0.2, front + 2.25]} material={m.paving} />
      <Box args={[5.6, 0.2, 0.45]} position={[0, 0.1, front + 2.7]} material={m.paving} />

      {/* rosette and glazed double door on the recessed back wall */}
      <Rosette position={[0, 5.15, coreFront + 0.05]} size={1.5} />
      <Box args={[2.7, 3.5, 0.12]} position={[0, doorY, coreFront + 0.06]} material={m.metal} shadow={false} />
      <Plane args={[2.4, 3.2]} position={[0, doorY, coreFront + 0.13]} material={m.doorGlass} />
      {[-0.6, 0, 0.6].map((dx) => (
        <Box key={dx} args={[0.05, 3.2, 0.05]} position={[dx, doorY, coreFront + 0.16]} material={m.metal} shadow={false} />
      ))}
      {[0, 1, 2, 3].map((k) => (
        <Box key={k} args={[2.4, 0.05, 0.05]} position={[0, PORTAL_FLOOR + 0.5 + k * 0.8, coreFront + 0.16]} material={m.metal} shadow={false} />
      ))}

      {/* lanterns and gold topiary beside the door */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 1.75, PORTAL_FLOOR + 0.7, coreFront + 1]} material={m.metal}>
            <cylinderGeometry args={[0.05, 0.05, 1.4, 8]} />
          </mesh>
          <mesh position={[s * 1.75, PORTAL_FLOOR + 1.55, coreFront + 1]} material={m.lantern}>
            <cylinderGeometry args={[0.12, 0.09, 0.35, 8]} />
          </mesh>
          <mesh position={[s * 1.25, PORTAL_FLOOR + 0.22, coreFront + 1.3]} material={m.whitePot}>
            <cylinderGeometry args={[0.2, 0.16, 0.45, 12]} />
          </mesh>
          <mesh position={[s * 1.25, PORTAL_FLOOR + 0.8, coreFront + 1.3]} material={m.topiary} castShadow>
            <sphereGeometry args={[0.38, 16, 12]} />
          </mesh>
          {/* potted palms at the foot of the steps */}
          <mesh position={[s * 3.3, 0.3, front + 3.3]} material={m.clayPot}>
            <cylinderGeometry args={[0.25, 0.2, 0.6, 12]} />
          </mesh>
          <mesh position={[s * 3.3, 1.3, front + 3.3]} material={m.foliage} castShadow>
            <coneGeometry args={[0.6, 1.4, 8]} />
          </mesh>
          {night && <pointLight position={[s * 1.75, PORTAL_FLOOR + 1.55, coreFront + 1.2]} intensity={4} distance={6} color="#ffb04d" />}
        </group>
      ))}
      {night && <pointLight position={[0, 3.2, coreFront + 1.8]} intensity={18} distance={10} color="#ffc070" />}
      {night && <pointLight position={[0, 1.2, front + 6]} intensity={40} distance={16} decay={1.3} color="#ffc27a" />}

      {/* entrance walkway through a lawn, as in the photo.
          The heights are staggered against the campus ground layers
          (plot 0.03, grass 0.04, courtyard lawn 0.05) so the path reads on
          top and the lawn tucks under, without z-fighting where they overlap. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.055, front + 11]} material={m.paving} receiveShadow>
        <planeGeometry args={[3, 16]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, front + 9]} material={m.lawn} receiveShadow>
        <planeGeometry args={[lawnWidth, 14]} />
      </mesh>
    </group>
  );
}
