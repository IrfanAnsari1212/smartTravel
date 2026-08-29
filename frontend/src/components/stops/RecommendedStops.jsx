import { useState } from "react";
import { normalizeExternalUrl, PLACE_FILTERS } from "../../utils/formatters";

const CATEGORY_BADGES = {
  attraction: { label: "Attraction", bg: "bg-purple-500/15 text-purple-200 border-purple-500/30", icon: "🏛️" },
  restaurant: { label: "Food & Cafe", bg: "bg-amber-500/15 text-amber-200 border-amber-500/30", icon: "🍽️" },
  hotel: { label: "Hotel & Stay", bg: "bg-blue-500/15 text-blue-200 border-blue-500/30", icon: "🏨" },
  fuel: { label: "Fuel & EV", bg: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30", icon: "⛽" },
  hospital: { label: "Hospital", bg: "bg-rose-500/15 text-rose-200 border-rose-500/30", icon: "🏥" },
  police: { label: "Police", bg: "bg-indigo-500/15 text-indigo-200 border-indigo-500/30", icon: "👮" },
  mechanic: { label: "Mechanic", bg: "bg-orange-500/15 text-orange-200 border-orange-500/30", icon: "🔧" },
  pharmacy: { label: "Pharmacy", bg: "bg-teal-500/15 text-teal-200 border-teal-500/30", icon: "💊" },
  atm: { label: "ATM / Bank", bg: "bg-cyan-500/15 text-cyan-200 border-cyan-500/30", icon: "🏧" },
  parking: { label: "Parking", bg: "bg-slate-500/15 text-slate-200 border-slate-500/30", icon: "🅿️" },
};

export default function RecommendedStops({ route, stopFiltersLabel }) {
  const [activeCategoryTab, setActiveCategoryTab] = useState("all");
  const places = route?.places || [];
  const placeLookup = route?.placeLookup;

  const filteredPlaces = activeCategoryTab === "all"
    ? places
    : places.filter((p) => p.category === activeCategoryTab);

  const availableCategories = Array.from(new Set(places.map((p) => p.category)));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-white">Discovered Stops & Attractions</h3>
          <p className="mt-1 text-xs text-slate-400">{stopFiltersLabel}</p>
        </div>
        <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
          {places.length} places found
        </span>
      </div>

      {places.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveCategoryTab("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              activeCategoryTab === "all"
                ? "bg-cyan-400 text-slate-950"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            All ({places.length})
          </button>
          {availableCategories.map((cat) => {
            const count = places.filter((p) => p.category === cat).length;
            const filterMeta = PLACE_FILTERS.find((f) => f.id === cat);
            const badgeMeta = CATEGORY_BADGES[cat];

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategoryTab(cat)}
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
                  activeCategoryTab === cat
                    ? "bg-cyan-400 text-slate-950"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span>{badgeMeta?.icon || filterMeta?.icon || "📍"}</span>
                <span>{filterMeta?.label || cat}</span>
                <span className="opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="space-y-3">
        {filteredPlaces.length ? (
          filteredPlaces.map((place) => {
            const badge = CATEGORY_BADGES[place.category] || {
              label: place.category,
              bg: "bg-slate-800 text-slate-300 border-slate-700",
              icon: "📍",
            };

            return (
              <div
                key={place.id}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-4 transition hover:border-slate-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{badge.icon}</span>
                      <p className="font-medium text-white">{place.name}</p>
                    </div>
                    {place.brand && (
                      <p className="mt-1 text-xs text-slate-300">{place.brand}</p>
                    )}
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200 transition hover:border-cyan-300 hover:text-cyan-100"
                  >
                    Open Map
                  </a>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className={`rounded-full border px-2.5 py-0.5 font-medium ${badge.bg}`}>
                    {badge.label}
                  </span>
                  {place.cuisine && (
                    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-slate-300">
                      🍽️ {place.cuisine}
                    </span>
                  )}
                  {place.openingHours && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 ${
                        place.openingHours === "24/7"
                          ? "bg-emerald-500/20 text-emerald-200"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      🕒 {place.openingHours === "24/7" ? "Open 24/7" : place.openingHours}
                    </span>
                  )}
                </div>

                <p className="mt-2.5 text-xs text-slate-400">
                  {place.address || "Address details from OpenStreetMap"}
                </p>

                {place.highlights?.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {place.highlights.map((highlight) => (
                      <span
                        key={highlight}
                        className="rounded-full border border-slate-800 bg-slate-900 px-2.5 py-0.5 text-xs text-slate-300"
                      >
                        ✓ {highlight}
                      </span>
                    ))}
                  </div>
                )}

                {(place.phone || place.website) && (
                  <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-800/60 pt-2 text-xs">
                    {place.phone && (
                      <a
                        href={`tel:${place.phone}`}
                        className="text-cyan-200 transition hover:text-cyan-100 hover:underline"
                      >
                        📞 {place.phone}
                      </a>
                    )}
                    {place.website && (
                      <a
                        href={normalizeExternalUrl(place.website)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-200 transition hover:text-cyan-100 hover:underline"
                      >
                        🌐 Visit Website
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-700 px-4 py-6 text-sm text-slate-400">
            {placeLookup?.status === "unavailable"
              ? "Nearby-stop data is temporarily unavailable. Your route geometry is still saved and valid."
              : "No stops found matching this category filter on this route."}
          </p>
        )}
      </div>
    </div>
  );
}
