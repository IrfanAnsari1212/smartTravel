import { normalizeExternalUrl } from "../utils/formatters";

export default function RecommendedStops({ route, stopFiltersLabel }) {
  const places = route?.places || [];
  const placeLookup = route?.placeLookup;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white">Recommended Stops</h3>
        <p className="mt-1 text-sm text-slate-400">{stopFiltersLabel}</p>
      </div>

      <div className="space-y-3">
        {places.length ? (
          places.map((place) => (
            <div
              key={place.id}
              className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{place.name}</p>
                  {place.brand && (
                    <p className="mt-1 text-sm text-slate-300">{place.brand}</p>
                  )}
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200 transition hover:border-cyan-300 hover:text-cyan-100"
                >
                  Open
                </a>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-cyan-100">
                  {place.category}
                </span>
                {place.cuisine && (
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">
                    {place.cuisine}
                  </span>
                )}
                {place.openingHours && (
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">
                    {place.openingHours === "24/7"
                      ? "Open 24/7"
                      : place.openingHours}
                  </span>
                )}
              </div>

              <p className="mt-3 text-sm text-slate-400">
                {place.address || "Address details unavailable"}
              </p>

              {place.highlights?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {place.highlights.map((highlight) => (
                    <span
                      key={highlight}
                      className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              )}

              {(place.phone || place.website) && (
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  {place.phone && (
                    <a
                      href={`tel:${place.phone}`}
                      className="text-cyan-200 transition hover:text-cyan-100"
                    >
                      {place.phone}
                    </a>
                  )}
                  {place.website && (
                    <a
                      href={normalizeExternalUrl(place.website)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-200 transition hover:text-cyan-100"
                    >
                      Website
                    </a>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-700 px-4 py-6 text-sm text-slate-400">
            {placeLookup?.status === "unavailable"
              ? "Nearby-stop data is temporarily unavailable. Your route is still saved and can be retried later."
              : "No stops matched the selected filters on this route."}
          </p>
        )}
      </div>
    </div>
  );
}
