import Image from "next/image";
import Link from "next/link";
import { wings } from "@/data/wings";
import { zones } from "@/data/zones";
import { DayNightImage } from "@/components/DayNightImage";

export default function HomePage() {
  return (
    <div>
      <section className="relative flex min-h-[80vh] items-center overflow-hidden">
        <DayNightImage
          daySrc="/images/entrance-plaza.webp"
          nightSrc="/images/building-night-1.webp"
          alt="Sobha Neopolis entrance plaza"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative z-10 mx-auto max-w-6xl px-4 text-white">
          <p className="font-serif text-sm uppercase tracking-[0.2em] text-emerald-200">Panathur, East Bengaluru</p>
          <h1 className="mt-3 max-w-2xl font-serif text-4xl font-semibold leading-tight sm:text-6xl">
            Walk through Sobha Neopolis in 3D
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/85">
            Drag to orbit, zoom in, and explore all {wings.length} residential wings across both campuses — see the
            courtyards, lawns and pools exactly as laid out on site, by day and by night.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/master-plan"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-stone-900 transition-transform hover:scale-105"
            >
              Start the 3D Walkthrough
            </Link>
            <Link
              href="/enquire"
              className="rounded-full border border-white/60 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Enquire Now
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">19 Wings</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold">Two campuses, one address</h2>
            <p className="mt-3 text-stone-600">
              North Campus (Wing-01 to Wing-11) and South Campus (Wing-12 to Wing-19), on either side of the 18 m
              CDP road, with courtyards and a walkway linking Wing-17 and Wing-18.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Lawns &amp; Pools</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold">Celebration Lawn, Meandering &amp; Leisure Pools</h2>
            <p className="mt-3 text-stone-600">
              Landscaped courtyard lawns sit between every wing cluster, with the Meandering Pool and Leisure Pool
              shown on the master plan.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Day &amp; Night</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold">Toggle the whole site</h2>
            <p className="mt-3 text-stone-600">
              Use the sun/moon switch in the header to see building exteriors and the plaza transform from day to
              night, on every page.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-stone-50 py-16 dark-surface">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-serif text-3xl font-semibold">Amenity zones</h2>
            <Link href="/amenities" className="text-sm font-medium text-emerald-700 hover:underline">
              View all amenities →
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {zones.map((zone) => (
              <div key={zone.key} className="rounded-xl border border-black/10 bg-white p-5 dark-surface">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${zone.colorClass}`} />
                <h3 className="mt-3 font-semibold">{zone.label}</h3>
                <p className="mt-1 text-sm text-stone-500">{zone.amenities.length} amenities</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-serif text-3xl font-semibold">Building gallery</h2>
          <Link href="/wings" className="text-sm font-medium text-emerald-700 hover:underline">
            Browse all wings →
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
            <Image src="/images/building-day-1.webp" alt="Sobha Neopolis buildings, day view" fill className="object-cover" />
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
            <Image src="/images/building-night-2.jpg" alt="Sobha Neopolis buildings, night view" fill className="object-cover" />
          </div>
        </div>
      </section>
    </div>
  );
}
