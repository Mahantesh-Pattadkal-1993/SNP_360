import Image from "next/image";
import Link from "next/link";
import { wings, getWing } from "@/data/wings";
import { WingDetailViewer } from "./WingDetailViewer";

export function generateStaticParams() {
  return wings.map((wing) => ({ id: wing.id }));
}

export function generateMetadata({ params }: { params: { id: string } }) {
  const wing = getWing(params.id);
  return { title: wing ? `${wing.name} | Sobha Neopolis 360` : "Wing not found" };
}

export default function WingDetailPage({ params }: { params: { id: string } }) {
  const wing = getWing(params.id);
  if (!wing) {
    return null;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Link href="/master-plan" className="text-sm font-medium text-emerald-700 hover:underline">
        ← Back to Master Plan
      </Link>

      <h1 className="mt-4 font-serif text-4xl font-semibold">{wing.name}</h1>
      <p className="mt-2 text-stone-600">
        {wing.campus === "north" ? "North Campus" : "South Campus"} · {wing.cluster}
      </p>
      {wing.connectors?.map((c) => (
        <p key={c.wingNumber} className="mt-1 text-sm text-emerald-700">
          Connected to Wing-{String(c.wingNumber).padStart(2, "0")} via {c.via}
        </p>
      ))}

      <div className="mt-8">
        <WingDetailViewer wingId={wing.id} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <figure className="overflow-hidden rounded-xl">
          <div className="relative aspect-[4/3] w-full">
            <Image src="/images/building-entrance.jpg" alt="Wing-18 entrance, reference photo" fill className="object-cover" />
          </div>
          <figcaption className="mt-2 text-sm text-stone-500">
            Reference entrance photo (Wing-18) used to model the 3D entrance above
          </figcaption>
        </figure>
        <figure className="overflow-hidden rounded-xl">
          <div className="relative aspect-[4/3] w-full">
            <Image src="/images/building-lobby.jpg" alt="Lobby, reference photo" fill className="object-cover" />
          </div>
          <figcaption className="mt-2 text-sm text-stone-500">Lobby (reference photo, interior not yet modeled)</figcaption>
        </figure>
      </div>

      <div className="mt-10 rounded-xl border border-dashed border-stone-300 p-5 text-sm text-stone-500">
        The 3D model above is built from the Wing-18 entrance and exterior reference photos (twin-tower massing,
        two-sided balconies, arched entrance with numbered plaque). Only Wing-18&apos;s entrance photo was supplied,
        so every wing currently reuses that same facade design with its own number — floor counts, exact dimensions,
        and whether other wings&apos; entrances differ are outstanding; see requirements.md §9.
      </div>
    </div>
  );
}
