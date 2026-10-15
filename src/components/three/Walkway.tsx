"use client";

import { WING_DEPTH } from "@/data/wings";

/** Simple flat path mesh connecting two wing positions — stands in for the Wing-17/Wing-18 walkway photo until a modeled asset is supplied. */
export function Walkway({ from, to }: { from: [number, number]; to: [number, number] }) {
  const [x1, z1] = from;
  const [x2, z2] = to;
  const midX = (x1 + x2) / 2;
  const midZ = (z1 + z2) / 2;
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.sqrt(dx * dx + dz * dz) - WING_DEPTH * 0.6;
  const angle = Math.atan2(dx, dz);

  return (
    <mesh position={[midX, 0.1, midZ]} rotation={[-Math.PI / 2, 0, angle]} receiveShadow>
      <planeGeometry args={[3, Math.max(length, 1)]} />
      <meshStandardMaterial color="#c9b89a" roughness={0.9} />
    </mesh>
  );
}
