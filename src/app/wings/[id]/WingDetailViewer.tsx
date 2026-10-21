"use client";

import dynamic from "next/dynamic";
import { useState, type FormEvent } from "react";
import { getWing } from "@/data/wings";
import { parseFlatNumber, type FlatRef } from "@/data/flats";
import { useDayNight } from "@/components/DayNightProvider";

const WingViewer = dynamic(() => import("@/components/three/WingViewer").then((m) => m.WingViewer), {
  ssr: false,
  loading: () => (
    <div className="flex h-[70vh] w-full items-center justify-center rounded-2xl bg-stone-900 text-sm text-white">
      Loading 3D model…
    </div>
  ),
});

export function WingDetailViewer({ wingId }: { wingId: string }) {
  const wing = getWing(wingId);
  const { mode } = useDayNight();
  const [input, setInput] = useState("");
  const [flat, setFlat] = useState<FlatRef | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [flyToken, setFlyToken] = useState(0);
  if (!wing) return null;

  const supportsFlats = wing.detailedModel;

  function handleFind(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = parseFlatNumber(input, wing!.number, wing!.floors);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setFlat(result.flat);
  }

  return (
    <div>
      {supportsFlats && (
        <div className="mb-4 rounded-xl border border-black/10 p-4 dark-surface">
          <form onSubmit={handleFind} className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="flat" className="text-sm font-medium">
                Find a flat
              </label>
              <input
                id="flat"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                inputMode="numeric"
                placeholder="e.g. 1801"
                className="mt-1 block w-40 rounded-lg border border-black/15 px-3 py-2 text-stone-900"
              />
            </div>
            <button type="submit" className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
              Highlight
            </button>
            {flat && (
              <>
                <button
                  type="button"
                  onClick={() => setFlyToken((t) => Math.abs(t) + 1)}
                  className="rounded-full bg-cyan-600 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
                >
                  View from outside the flat
                </button>
                <button
                  type="button"
                  onClick={() => setFlyToken((t) => -Math.abs(t) - 1)}
                  className="rounded-full border border-black/15 px-5 py-2 text-sm font-semibold hover:bg-black/5"
                >
                  Back to full building
                </button>
              </>
            )}
          </form>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          {flat && !error && (
            <p className="mt-2 text-sm text-stone-600">
              Flat <strong>{flat.code}</strong> · {flat.floor === 0 ? "Ground floor" : `Floor ${flat.floor}`} · Series{" "}
              {flat.series.series}
              {` – ${flat.series.label}`} · {flat.series.corner} corner
            </p>
          )}
          <p className="mt-2 text-xs text-stone-400">
            Format: wing + floor + flat, e.g. {wing.number}01 = Wing {wing.number}, ground floor, flat 1;{" "}
            {wing.number}184 = floor 18, flat 4. Floors 0–18, flats 1–4 per floor (Wing 18/19 legends,
            master plan).
          </p>
        </div>
      )}
      <WingViewer wing={wing} mode={mode} flat={flat} flyToken={flyToken} />
    </div>
  );
}
