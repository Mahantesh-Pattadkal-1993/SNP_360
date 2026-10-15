import { site, siteMapsEmbedUrl, siteDirectionsUrl } from "@/data/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-black/5 bg-stone-50 dark-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold">{site.name}</h2>
          <p className="mt-2 max-w-sm text-sm text-stone-600">{site.address}</p>
          <p className="mt-1 text-sm text-stone-500">Plus Code: {site.plusCode}</p>
          <a
            href={siteDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-medium text-emerald-700 underline-offset-2 hover:underline"
          >
            Get directions →
          </a>
          <p className="mt-6 text-xs text-stone-400">
            Independently built fan/preview site using assets provided by the project team. Not an official Sobha
            Limited property. Logo and renders used with permission pending — see requirements.md §9.
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-black/10">
          <iframe
            title="Sobha Neopolis location"
            src={siteMapsEmbedUrl}
            className="h-64 w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </footer>
  );
}
