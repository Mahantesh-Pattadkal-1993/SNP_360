"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type Mode = "day" | "night";

const DayNightContext = createContext<{ mode: Mode; toggle: () => void } | null>(null);

export function DayNightProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>("day");
  const toggle = () => setMode((current) => (current === "day" ? "night" : "day"));
  return (
    <DayNightContext.Provider value={{ mode, toggle }}>
      <div className={mode === "night" ? "night" : "day"}>{children}</div>
    </DayNightContext.Provider>
  );
}

export function useDayNight() {
  const ctx = useContext(DayNightContext);
  if (!ctx) throw new Error("useDayNight must be used within DayNightProvider");
  return ctx;
}
