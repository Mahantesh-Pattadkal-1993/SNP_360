import Link from "next/link";
import { wings } from "@/data/wings";

export const metadata = { title: "Wings | Sobha Neopolis 360" };

export default function WingsIndexPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-serif text-4xl font-semibold">All 19 Wings</h1>
      <p className="mt-3 max-w-2xl text-stone-600">
        Wing-01 through Wing-11 make up the North Campus; Wing-12 through Wing-19 make up the South Campus.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {wings.map((wing) => (
          <Link
            key={wing.id}
            href={`/wings/${wing.id}`}
            className="rounded-lg border border-black/10 p-4 transition-colors hover:border-emerald-700 hover:bg-emerald-50 dark-surface"
          >
            <p className="font-semibold">{wing.name}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-emerald-700">
              {wing.campus === "north" ? "North Campus" : "South Campus"}
            </p>
            <p className="mt-1 text-sm text-stone-500">{wing.cluster}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
