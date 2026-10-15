import { zones } from "@/data/zones";

export const metadata = { title: "Amenities | Sobha Neopolis 360" };

export default function AmenitiesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-serif text-4xl font-semibold">Amenities</h1>
      <p className="mt-3 max-w-2xl text-stone-600">
        Four amenity zones as shown on the master plan — including the Celebration Lawn and the Meandering and
        Leisure Pools.
      </p>

      <div className="mt-10 space-y-10">
        {zones.map((zone) => (
          <section key={zone.key}>
            <div className="flex items-center gap-2">
              <span className={`inline-block h-3 w-3 rounded-full ${zone.colorClass}`} />
              <h2 className="font-serif text-2xl font-semibold">{zone.label}</h2>
            </div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {zone.amenities.map((amenity) => (
                <li
                  key={amenity}
                  className="rounded-lg border border-black/10 px-4 py-3 text-sm text-stone-700 dark-surface"
                >
                  {amenity}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
