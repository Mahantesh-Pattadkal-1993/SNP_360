"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import Link from "next/link";
import { useDayNight } from "@/components/DayNightProvider";
import { wings, type Wing } from "@/data/wings";

const CampusViewer = dynamic(() => import("@/components/three/CampusViewer").then((m) => m.CampusViewer), {
  ssr: false,
  loading: () => (
    <div className="flex h-[75vh] w-full items-center justify-center rounded-2xl bg-stone-900 text-sm text-white">
      Loading 3D walkthrough…
    </div>
  ),
});

export default function MasterPlanPage() {
  const [selected, setSelected] = useState<Wing | null>(null);
  const { mode } = useDayNight();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-serif text-4xl font-semibold">Virtual Walkthrough</h1>
      <p className="mt-3 max-w-2xl text-stone-600">
        Drag to orbit, scroll to zoom, and click any wing to see its details. The North Campus (Wing-01–11) sits
        across the 18 m CDP road from the South Campus (Wing-12–19) and the lake, laid out as on the full-site
        master plan. Switch Day/Night in the header to see it relit.
      </p>

      <div className="mt-6">
        <CampusViewer mode={mode} onSelectWing={setSelected} highlightedWingId={selected?.id} />
      </div>

      {selected && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark-surface">
          <div>
            <p className="font-semibold">{selected.name}</p>
            <p className="text-sm text-stone-600">{selected.cluster}</p>
            {selected.connectors?.map((c) => (
              <p key={c.wingNumber} className="text-xs text-emerald-700">
                ↔ Wing-{String(c.wingNumber).padStart(2, "0")} via {c.via}
              </p>
            ))}
          </div>
          <Link
            href={`/wings/${selected.id}`}
            className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Open wing page →
          </Link>
        </div>
      )}

      <h2 className="mt-10 font-serif text-2xl font-semibold">All 19 Wings</h2>
      <p className="mt-1 text-sm text-stone-500">North Campus (01–11) and South Campus (12–19), one connected site.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {wings.map((wing) => (
          <button
            key={wing.id}
            type="button"
            onClick={() => setSelected(wing)}
            className={`rounded-lg border p-4 text-left transition-colors dark-surface ${
              selected?.id === wing.id
                ? "border-emerald-700 bg-emerald-50"
                : "border-black/10 hover:border-emerald-700 hover:bg-emerald-50"
            }`}
          >
            <p className="font-semibold">{wing.name}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-emerald-700">
              {wing.campus === "north" ? "North Campus" : "South Campus"}
            </p>
            <p className="mt-1 text-sm text-stone-500">{wing.cluster}</p>
          </button>
        ))}
      </div>

      <p className="mt-10 text-xs text-stone-400">
        Building massing, facade detail, and positions above are modeled to match the reference entrance/exterior
        photos and the confirmed clustering from the master-plan images — not yet based on surveyed GPS/footprint
        data or architectural drawings. See requirements.md §9 for what&apos;s still needed for a precisely-placed,
        fully accurate model.
      </p>
    </div>
  );
}
