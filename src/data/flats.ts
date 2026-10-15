// Flat numbering, from Master-Plan-Sobha-Neopolis.webp (Wing 18 legend + red series numbers on the plan).
// Flat number = wing number + floor + series digit, e.g. "1801" = Wing 18, floor 0 (ground), flat 1;
// "19184" = Wing 19, floor 18, flat 4. Wing 19 is the identical tower attached to Wing 18, so it
// reuses the same 4-flats-per-floor layout (series labels are only printed for Wing 18).

export type Series = 1 | 2 | 3 | 4;
export type Side = -1 | 1;

export interface FlatSeries {
  series: Series;
  /** Label as printed in the Wing 18 legend. */
  label: string;
  /** Plan position of the flat within the wing (plan north is up). */
  corner: "South-west" | "North-west" | "North-east" | "South-east";
  /** Which tower: -1 = west tower, 1 = east tower. */
  tower: Side;
  /** Which face: 1 = south/front (entrance side), -1 = north/back. */
  face: Side;
}

export const WING18_FLOORS = 19; // floors 0 (ground) to 18

export const WING18_SERIES: Record<Series, FlatSeries> = {
  1: { series: 1, label: "2481 Prime North", corner: "South-west", tower: -1, face: 1 },
  2: { series: 2, label: "2481 Select West", corner: "North-west", tower: -1, face: -1 },
  3: { series: 3, label: "2481 Grande East", corner: "North-east", tower: 1, face: -1 },
  // legend prints "2841"; every other Wing 18 series is 2481, so this is very likely a typo
  4: { series: 4, label: "2841 Elite North", corner: "South-east", tower: 1, face: 1 },
};

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
  if (!(seriesDigit in WING18_SERIES)) return { ok: false, error: "The last digit is the flat (1–4) on that floor." };
  return { ok: true, flat: { code, wingNumber, floor, series: WING18_SERIES[seriesDigit as Series] } };
}
