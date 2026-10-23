// Flat numbering, from Master-Plan-Sobha-Neopolis.webp (Wing 18 + Wing 19 legends and the red
// series numbers on the plan).
// Flat number = wing number + floor + series digit, e.g. "1801" = Wing 18, floor 0 (ground), flat 1;
// "19184" = Wing 19, floor 18, flat 4. Wings 18 and 19 are the same twin-tower block, attached
// side by side, but MIRRORED: Wing 19 is the western half of the pair, so its series read
// East/West the opposite way round from Wing 18's.
//
// Wings 16 & 17 are a separate attached pair in the South Campus, with SIX series (1–6).
// They are mirrored twins: Wing 16 is west, Wing 17 is east. The series numbering maps 1↔1,
// 2↔2, … 6↔6 across the party wall. Both towers are gabled (unlike 18/19).

export type Series4 = 1 | 2 | 3 | 4;
export type Series6 = 1 | 2 | 3 | 4 | 5 | 6;
export type Series = Series4 | Series6;
export type Side = -1 | 1;

export interface FlatSeries {
  series: Series;
  /** Label as printed in the wing's legend. */
  label: string;
  /** Plan position of the flat within the wing (plan north is up). */
  corner: "South-west" | "North-west" | "North-east" | "South-east";
  /** Which tower: -1 = west tower, 1 = east tower. */
  tower: Side;
  /** Which face: 1 = north/courtyard (front for 16/17), -1 = south/back. */
  face: Side;
}

export const WING18_FLOORS = 19; // floors 0 (ground) to 18
export const WING1617_FLOORS = 20; // floors 0 (ground) to 19

export const WING18_SERIES: Record<Series4, FlatSeries> = {
  1: { series: 1, label: "2481 Prime North", corner: "South-west", tower: -1, face: 1 },
  2: { series: 2, label: "2481 Select West", corner: "North-west", tower: -1, face: -1 },
  3: { series: 3, label: "2481 Grande East", corner: "North-east", tower: 1, face: -1 },
  // legend prints "2841"; every other Wing 18 series is 2481, so this is very likely a typo
  4: { series: 4, label: "2841 Elite North", corner: "South-east", tower: 1, face: 1 },
};

// Wing 19 is the MIRRORED twin of Wing 18 (it is the western wing of the attached 18/19 pair,
// Wing 18 the eastern one), so its series sit on the opposite side of the block:
//   plan: red "3" on the north-west block and red "4" on the south-west block of the Wing-19 mass,
//   legend: "Series 3 – 2481 Select West" (Wing 18's series 2 is the one named "Select West").
// Series 3 & 4 therefore belong to Wing 19's WEST tower — the OUTER end of the pair, mirroring
// Wing 18, whose 3 & 4 are on its east (also outer) tower. The two party-wall towers are plain.
export const WING19_SERIES: Record<Series4, FlatSeries> = {
  1: { series: 1, label: "2481 Prime North", corner: "South-east", tower: 1, face: 1 },
  2: { series: 2, label: "2481 Select East", corner: "North-east", tower: 1, face: -1 },
  3: { series: 3, label: "2481 Select West", corner: "North-west", tower: -1, face: -1 },
  4: { series: 4, label: "2481 Elite North", corner: "South-west", tower: -1, face: 1 },
};

/** Wing 16 — WEST half of the 16/17 pair. Series 1–6, mirrored from Wing 17.
 *  Legend (context §3.1): 1=1915 West Facing Prime, 2=1611 West Facing Select, 3=1613 West Facing Grande,
 *  4=1611 East Facing Select, 5=1915 East Facing Prime, 6=Link to Wing 16.
 *  Plan position: wing 16 is the WEST wing, so its "east" tower faces the party wall.
 */
export const WING16_SERIES: Record<Series6, FlatSeries> = {
  1: { series: 1, label: "1915 West Facing Prime", corner: "South-west", tower: -1, face: 1 },
  2: { series: 2, label: "1611 West Facing Select", corner: "North-west", tower: -1, face: -1 },
  3: { series: 3, label: "1613 West Facing Grande", corner: "North-west", tower: 1, face: -1 },
  4: { series: 4, label: "1611 East Facing Select", corner: "North-east", tower: 1, face: -1 },
  5: { series: 5, label: "1915 East Facing Prime", corner: "South-east", tower: 1, face: 1 },
  6: { series: 6, label: "Link to Wing 16", corner: "South-west", tower: -1, face: 1 }, // connector bay at party wall
};

/** Wing 17 — EAST half of the 16/17 pair. Series 1–6, mirror of Wing 16.
 *  Legend (context §3.1): 1=1915 East Facing Elite, 2=1611 East Facing Select, 3=1613 East Facing Grande,
 *  4=1611 West Facing Select, 5=1915 West Facing Prime, 6=Link to Wing 16.
 *  Plan position: wing 17 is the EAST wing, so its "west" tower faces the party wall.
 */
export const WING17_SERIES: Record<Series6, FlatSeries> = {
  1: { series: 1, label: "1915 East Facing Elite", corner: "South-east", tower: 1, face: 1 },
  2: { series: 2, label: "1611 East Facing Select", corner: "North-east", tower: 1, face: -1 },
  3: { series: 3, label: "1613 East Facing Grande", corner: "North-east", tower: -1, face: -1 },
  4: { series: 4, label: "1611 West Facing Select", corner: "North-west", tower: -1, face: -1 },
  5: { series: 5, label: "1915 West Facing Prime", corner: "South-west", tower: -1, face: 1 },
  6: { series: 6, label: "Link to Wing 16", corner: "South-east", tower: 1, face: 1 }, // connector bay at party wall
};

/** The series map for a wing: 18/19 use 4 series; 16/17 use 6 series. */
export function seriesFor(wingNumber: number): Record<Series, FlatSeries> {
  if (wingNumber === 19) return WING19_SERIES as Record<Series, FlatSeries>;
  if (wingNumber === 16) return WING16_SERIES as Record<Series, FlatSeries>;
  if (wingNumber === 17) return WING17_SERIES as Record<Series, FlatSeries>;
  return WING18_SERIES as Record<Series, FlatSeries>;
}

export interface FlatRef {
  code: string;
  wingNumber: number;
  floor: number;
  series: FlatSeries;
}

export type FlatParseResult = { ok: true; flat: FlatRef } | { ok: false; error: string };

export function parseFlatNumber(input: string, wingNumber: number, floors: number): FlatParseResult {
  const code = input.replace(/[\s-]/g, "");
  const prefix = String(wingNumber);
  if (!/^\d+$/.test(code)) return { ok: false, error: "Use digits only, e.g. 1801." };
  if (!code.startsWith(prefix) || code.length < prefix.length + 2) {
    return { ok: false, error: `Flat numbers in Wing ${wingNumber} start with ${prefix}, e.g. ${prefix}01.` };
  }
  const floor = Number(code.slice(prefix.length, -1));
  const seriesDigit = Number(code.slice(-1));
  if (floor > floors - 1) return { ok: false, error: `Floor ${floor} doesn't exist — floors run 0 to ${floors - 1}.` };
  const seriesMap = seriesFor(wingNumber);
  if (!(seriesDigit in seriesMap)) {
    const maxSeries = wingNumber === 16 || wingNumber === 17 ? 6 : 4;
    return { ok: false, error: `The last digit is the flat (1–${maxSeries}) on that floor.` };
  }
  return { ok: true, flat: { code, wingNumber, floor, series: seriesMap[seriesDigit as Series] } };
}
