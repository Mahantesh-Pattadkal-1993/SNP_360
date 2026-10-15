"use client";

import { useDayNight } from "./DayNightProvider";

export function DayNightToggle() {
  const { mode, toggle } = useDayNight();
  const isNight = mode === "night";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isNight}
      aria-label={`Switch to ${isNight ? "day" : "night"} view`}
      className="flex items-center gap-2 rounded-full border border-current/20 bg-black/5 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/10 dark-surface"
    >
      <span aria-hidden>{isNight ? "🌙" : "☀️"}</span>
      {isNight ? "Night" : "Day"}
    </button>
  );
}
