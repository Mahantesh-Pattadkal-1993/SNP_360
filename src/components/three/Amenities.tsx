"use client";

import { useMemo } from "react";
import * as THREE from "three";

type Mode = "day" | "night";

/**
 * The landscaped strip behind the Wing 18 / Wing 19 pair (the north side of the
 * South Campus row), built from the master plan and "wing18-19 backside.jpeg".
 *
 *   spot 26 – seating area, directly behind Wing 19
 *   spot 23 – curvy walking track, directly behind Wing 18
 *   spot 12 – basketball court, at the east end of the row
 *
 * On the master plan these are three separate badges; only their ORDER and
 * POSITION along the row are taken from it, because the plan is "not to scale"
 * and draws them as symbols. Sizes here are real-world (a basketball court is
 * 28 x 15 m). The plan's geometry is otherwise schematic (see wings.ts §9), so
 * the same "proportionally faithful, not surveyed" caveat applies.
 */

/** A flat ribbon of paving following a curve — used for the walking track. */
function ribbonGeometry(points: [number, number][], width: number): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0, z)));
  const segments = 90;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = curve.getPoint(t);
    const tangent = curve.getTangent(t);
    // perpendicular in the ground plane
    const n = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize().multiplyScalar(width / 2);
    positions.push(p.x + n.x, 0, p.z + n.z);
    positions.push(p.x - n.x, 0, p.z - n.z);
    uvs.push(0, t, 1, t);
    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

/** Black lamp post with a curled arm, as along the path in the backside photo. */
function LampPost({ position, mode }: { position: [number, number]; mode: Mode }) {
  const light = mode === "night";
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh position={[0, 1.9, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.1, 3.8, 8]} />
        <meshStandardMaterial color="#232323" roughness={0.6} />
      </mesh>
      <mesh position={[0.3, 3.85, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
        <torusGeometry args={[0.3, 0.045, 6, 14, Math.PI * 0.85]} />
        <meshStandardMaterial color="#232323" roughness={0.6} />
      </mesh>
      <mesh position={[0.56, 3.66, 0]} castShadow>
        <boxGeometry args={[0.28, 0.36, 0.28]} />
        <meshStandardMaterial
          color={light ? "#ffd27a" : "#3a3a3a"}
          emissive={light ? "#ffb84d" : "#000000"}
          emissiveIntensity={light ? 2 : 0}
        />
      </mesh>
      {light && <pointLight position={[0.56, 3.4, 0]} intensity={8} distance={14} color="#ffc27a" />}
    </group>
  );
}

/**
 * Spot 26 — the seating area behind Wing 19: a stone plaza with a raised
 * circular planter ringed by a low concrete wall that doubles as seating.
 */
export function SeatingArea({ position, mode }: { position: [number, number]; mode: Mode }) {
  const [x, z] = position;
  const shrubs = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2 + 0.4;
        return { x: Math.cos(a) * 1.7, z: Math.sin(a) * 1.7, s: 0.55 + (i % 3) * 0.16 };
      }),
    [],
  );
  return (
    <group position={[x, 0, z]}>
      {/* stone plaza */}
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[8.5, 40]} />
        <meshStandardMaterial color="#cdc4b0" roughness={0.95} />
      </mesh>
      {/* curved lawn bed at the plaza edge */}
      <mesh position={[-5.6, 0.07, 3.4]} rotation={[-Math.PI / 2, 0, 0.5]} receiveShadow>
        <ringGeometry args={[2.6, 5.2, 24, 1, 0.6, 3.2]} />
        <meshStandardMaterial color="#4f8f52" roughness={1} />
      </mesh>
      {/* raised planter: soil, planting, and the concrete seat ring around it */}
      <mesh position={[0, 0.42, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.75, 28]} />
        <meshStandardMaterial color="#4a3a2a" roughness={1} />
      </mesh>
      {shrubs.map((s, i) => (
        <mesh key={i} position={[s.x, 0.42 + s.s * 0.6, s.z]} castShadow>
          <coneGeometry args={[s.s * 0.45, s.s * 1.3, 7]} />
          <meshStandardMaterial color="#3f7a48" roughness={0.95} />
        </mesh>
      ))}
      {/* a spiky plant in the middle, as in the photo */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <coneGeometry args={[0.85, 1.9, 9]} />
        <meshStandardMaterial color="#3c6b40" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.26, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[3.15, 3.25, 0.52, 32, 1, true]} />
        <meshStandardMaterial color="#b9b09a" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.52, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[2.78, 3.25, 32]} />
        <meshStandardMaterial color="#c6bda6" roughness={0.85} />
      </mesh>
      {/* bench seat on the plaza */}
      <mesh position={[2.4, 0.28, 5.4]} rotation={[0, -0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.16, 0.5]} />
        <meshStandardMaterial color="#8d7d5f" roughness={0.9} />
      </mesh>
      <mesh position={[2.4, 0.62, 5.2]} rotation={[0, -0.5, 0]} castShadow>
        <boxGeometry args={[2.4, 0.5, 0.12]} />
        <meshStandardMaterial color="#8d7d5f" roughness={0.9} />
      </mesh>
      <LampPost position={[-6.4, 6.2]} mode={mode} />
      <LampPost position={[6.8, -4.4]} mode={mode} />
    </group>
  );
}

/**
 * Spot 23 — the curvy walking track behind Wing 18: a brick-paved path that
 * meanders across the lawn, edged in stone.
 */
export function WalkingTrack({ points, mode }: { points: [number, number][]; mode: Mode }) {
  const geometry = useMemo(() => ribbonGeometry(points, 3.2), [points]);
  const edge = useMemo(() => ribbonGeometry(points, 4.1), [points]);
  const lamps = points.filter((_, i) => i % 2 === 1);
  return (
    <group>
      {/* stone edging, slightly wider and just under the brick */}
      <mesh position={[0, 0.05, 0]} geometry={edge} receiveShadow>
        <meshStandardMaterial color="#b3aa94" roughness={0.95} />
      </mesh>
      {/* brick paving */}
      <mesh position={[0, 0.08, 0]} geometry={geometry} receiveShadow>
        <meshStandardMaterial color="#b98d66" roughness={0.95} />
      </mesh>
      {lamps.map((p, i) => (
        <LampPost key={i} position={[p[0] + 2.6, p[1] - 2.2]} mode={mode} />
      ))}
    </group>
  );
}

/** One basketball hoop: post, backboard, rim and net. */
function Hoop({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[0.18, 3, 0.18]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.7} />
      </mesh>
      <mesh position={[0, 3.2, 0.45]} castShadow>
        <boxGeometry args={[1.8, 1.05, 0.08]} />
        <meshStandardMaterial color="#f2f0e6" roughness={0.6} />
      </mesh>
      <mesh position={[0, 3.1, 0.9]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.23, 0.025, 6, 16]} />
        <meshStandardMaterial color="#e2622a" roughness={0.5} />
      </mesh>
      <mesh position={[0, 2.85, 0.9]}>
        <cylinderGeometry args={[0.2, 0.14, 0.45, 10, 1, true]} />
        <meshStandardMaterial color="#e8e8e8" roughness={1} wireframe />
      </mesh>
    </group>
  );
}

/**
 * Spot 12 — the basketball court at the east end of the row: a blue playing
 * surface with painted lines, a hoop at each end, and a tall mesh fence.
 */
export function BasketballCourt({ position, mode }: { position: [number, number]; mode: Mode }) {
  const [x, z] = position;
  const W = 28;
  const D = 15;
  const line = "#f4f2e8";
  const fencePosts = Array.from({ length: 13 }, (_, i) => -W / 2 + (i * W) / 12).flatMap((px) => [
    [px, -D / 2] as [number, number],
    [px, D / 2] as [number, number],
  ]);
  return (
    <group position={[x, 0, z]}>
      {/* apron */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W + 7, D + 7]} />
        <meshStandardMaterial color="#6f8f6a" roughness={1} />
      </mesh>
      {/* playing surface */}
      <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#2f7fa8" roughness={0.85} />
      </mesh>
      {/* markings */}
      <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.12, D]} />
        <meshStandardMaterial color={line} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 1.95, 24]} />
        <meshStandardMaterial color={line} roughness={0.9} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * (W / 2 - 3.5), 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.8, 1.95, 24]} />
            <meshStandardMaterial color={line} roughness={0.9} />
          </mesh>
          <mesh position={[s * (W / 2 - 1.2), 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[2.4, 4.9]} />
            <meshStandardMaterial color={line} roughness={0.9} />
          </mesh>
          <Hoop position={[s * (W / 2 - 0.4), 0, 0]} rotation={s > 0 ? Math.PI / 2 : -Math.PI / 2} />
        </group>
      ))}
      {/* perimeter fence */}
      {fencePosts.map(([px, pz], i) => (
        <mesh key={i} position={[px, 1.5, pz]} castShadow>
          <boxGeometry args={[0.1, 3, 0.1]} />
          <meshStandardMaterial color="#2b2b2b" roughness={0.7} />
        </mesh>
      ))}
      {[-D / 2 - 1.2, D / 2 + 1.2].map((pz) => (
        <mesh key={pz} position={[0, 2.9, pz]}>
          <boxGeometry args={[W + 3, 0.08, 0.08]} />
          <meshStandardMaterial color="#2b2b2b" roughness={0.7} />
        </mesh>
      ))}
      {[-W / 2 - 1.5, W / 2 + 1.5].map((px) => (
        <mesh key={px} position={[px, 2.9, 0]}>
          <boxGeometry args={[0.08, 0.08, D + 3]} />
          <meshStandardMaterial color="#2b2b2b" roughness={0.7} />
        </mesh>
      ))}
      {mode === "night" && <pointLight position={[0, 6, 0]} intensity={40} distance={34} color="#eaf2ff" />}
    </group>
  );
}
