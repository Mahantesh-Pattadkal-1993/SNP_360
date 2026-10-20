// Solar position for the site (NOAA general solar position approximation, ~0.5° accuracy).
// Scene axes: east = +x, north = -z, up = +y (same as data/wings.ts).

import { site } from "./site";

const IST_OFFSET_HOURS = 5.5;
const RAD = Math.PI / 180;

function sceneDirection(altitude: number, azimuth: number): [number, number, number] {
  const alt = altitude * RAD;
  const azr = azimuth * RAD;
  return [Math.cos(alt) * Math.sin(azr), Math.sin(alt), -Math.cos(alt) * Math.cos(azr)];
}

export interface SunPosition {
  /** Degrees above the horizon (negative = below). */
  altitude: number;
  /** Degrees clockwise from true north (90 = east, 180 = south, 270 = west). */
  azimuth: number;
  /** Unit vector pointing from the site toward the sun, in scene axes. */
  direction: [number, number, number];
}

/**
 * Sun position at Sobha Neopolis for a calendar date and local IST clock time.
 * `hour` is decimal local time, e.g. 6.5 = 06:30 IST.
 */
export function sunPosition(date: Date, hour: number): SunPosition {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - start) / 86_400_000);
  const g = ((2 * Math.PI) / 365) * (dayOfYear - 1 + (hour - 12) / 24); // fractional year (rad)

  const eqTime =
    229.18 *
    (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl =
    0.006918 -
    0.399912 * Math.cos(g) +
    0.070257 * Math.sin(g) -
    0.006758 * Math.cos(2 * g) +
    0.000907 * Math.sin(2 * g) -
    0.002697 * Math.cos(3 * g) +
    0.00148 * Math.sin(3 * g);

  const trueSolarMinutes = hour * 60 + eqTime + 4 * site.longitude - 60 * IST_OFFSET_HOURS;
  const hourAngle = (trueSolarMinutes / 4 - 180) * RAD;
  const lat = site.latitude * RAD;

  const cosZenith = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(hourAngle);
  const zenith = Math.acos(Math.min(1, Math.max(-1, cosZenith)));
  const altitude = 90 - zenith / RAD;

  // azimuth from north, clockwise
  const az = Math.atan2(
    Math.sin(hourAngle),
    Math.cos(hourAngle) * Math.sin(lat) - Math.tan(decl) * Math.cos(lat),
  );
  const azimuth = (az / RAD + 180 + 360) % 360;

  return { altitude, azimuth, direction: sceneDirection(altitude, azimuth) };
}

export function compassLabel(azimuth: number): string {
  const labels = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return labels[Math.round(azimuth / 45) % 8];
}

/**
 * Fixed date used by the five time-slot views. It represents the March equinox,
 * not the user's current date.
 */
export const SUN_REFERENCE_DATE = new Date(2026, 2, 20);

/**
 * At Sobha Neopolis the real sun is below the horizon at 6 AM on the reference date.
 * Lift that slot just above the horizon so it remains a useful sunrise view; this is a
 * presentation estimate, not solar data, and is disclosed in the viewer.
 */
const MIN_SLOT_ALTITUDE = 4;

export interface SunSlot {
  /** Local IST hour: 6, 9, 12, 15 or 18. */
  hour: number;
  label: string;
  /** Position rendered by the scene; altitude may be clamped. */
  sun: SunPosition;
  /** Real solar altitude on SUN_REFERENCE_DATE at this hour. */
  trueAltitude: number;
  clamped: boolean;
}

function makeSlot(hour: number, label: string): SunSlot {
  const real = sunPosition(SUN_REFERENCE_DATE, hour);
  const clamped = real.altitude < MIN_SLOT_ALTITUDE;
  const altitude = clamped ? MIN_SLOT_ALTITUDE : real.altitude;

  return {
    hour,
    label,
    sun: {
      altitude,
      azimuth: real.azimuth,
      direction: sceneDirection(altitude, real.azimuth),
    },
    trueAltitude: real.altitude,
    clamped,
  };
}

export const SUN_SLOTS: readonly SunSlot[] = [
  makeSlot(6, "6 AM"),
  makeSlot(9, "9 AM"),
  makeSlot(12, "12 PM"),
  makeSlot(15, "3 PM"),
  makeSlot(18, "6 PM"),
];

export const DEFAULT_SUN_SLOT_HOUR = 9;
