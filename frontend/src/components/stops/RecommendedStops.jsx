import { useState } from "react";
import { normalizeExternalUrl, PLACE_FILTERS } from "../../utils/formatters";
import { AIBadge } from "../ai/AIBadge";
import { MapPin, Phone, Globe, ExternalLink } from "lucide-react";

const CATEGORY_META = {
  attraction: { label: "Attraction",  icon: "🏛️", color: "text-violet-400 bg-violet-950/50 border-violet-800/50" },
  restaurant:  { label: "Food & Cafe", icon: "🍽️", color: "text-amber-400 bg-amber-950/50 border-amber-800/50" },
  hotel:       { label: "Hotel",       icon: "🏨", color: "text-blue-400 bg-blue-950/50 border-blue-800/50" },
  fuel:        { label: "Fuel / EV",   icon: "⛽", color: "text-emerald-400 bg-emerald-950/50 border-emerald-800/50" },
  hospital:    { label: "Hospital",    icon: "🏥", color: "text-danger-400 bg-danger-950/50 border-danger-800/50" },
  police:      { label: "Police",      icon: "👮", color: "text-brand-400 bg-brand-950/50 border-brand-800/50" },
  mechanic:    { label: "Mechanic",    icon: "🔧", color: "text-orange-400 bg-orange-950/50 border-orange-800/50" },
  pharmacy:    { label: "Pharmacy",    icon: "💊", color: "text-teal-400 bg-teal-950/50 border-teal-800/50" },
  atm:         { label: "ATM",         icon: "🏧", color: "text-map-400 bg-map-950/50 border-map-800/50" },
  parking:     { label: "Parking",     icon: "🅿️", color: "text-zinc-300 bg-zinc-800 border-zinc-700" },
};

export default function RecommendedStops({ route, stopFiltersLabel }) {
  const [activeCategoryTab, setActiveCategoryTab] = useState("all");
  const places = route?.places || [];
  const placeLookup = route?.placeLookup;

  const filteredPlaces = activeCategoryTab === "all"
    ? places
    : places.filter((p) => p.category === activeCategoryTab);

  const availableCategories = Array.from(new Set(places.map((p) => p.category)));

  if (places.length === 0 && placeLookup?.status !== "unavailable") return null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <AIBadge>AI Found</AIBadge>
            <span className="text-xs text-zinc-600">{places.length} places along route</span>
          </div>
          <h3 className="mt-1.5 text-sm font-semibold text-zinc-100">Stops & Attractions</h3>
          {stopFiltersLabel && (
            <p className="mt-0.5 text-[11px] text-zinc-600">{stopFiltersLabel}</p>
          )}
        </div>
      </div>

      {/* Category tabs */}
      {places.length > 0 && (
        <div className="scrollbar-none flex gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveCategoryTab("all")}
            className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition ${
              activeCategoryTab === "all"
                ? "border-brand-500/50 bg-brand-950/50 text-brand-300"
                : "border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400"
            }`}
          >
            All ({places.length})
          </button>
          {availableCategories.map((cat) => {
            const count = places.filter((p) => p.category === cat).length;
            const meta = CATEGORY_META[cat] || { label: cat, icon: "📍" };
            const filterMeta = PLACE_FILTERS.find((f) => f.id === cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategoryTab(cat)}
                className={`flex whitespace-nowrap items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition ${
                  activeCategoryTab === cat
                    ? "border-brand-500/50 bg-brand-950/50 text-brand-300"
                    : "border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400"
                }`}
              >
                <span>{meta.icon}</span>
                <span>{filterMeta?.label || meta.label}</span>
                <span className="opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Place cards */}
      <div className="space-y-2">
        {filteredPlaces.length ? (
          filteredPlaces.map((place) => <PlaceCard key={place.id} place={place} />)
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-800 px-4 py-8 text-center">
            <p className="text-sm text-zinc-600">
              {placeLookup?.status === "unavailable"
                ? "Nearby stop data is temporarily unavailable. Route is still saved."
                : "No stops found for this category filter."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PlaceCard({ place }) {
  const meta = CATEGORY_META[place.category] || { label: place.category, icon: "📍", color: "text-zinc-400 bg-zinc-800 border-zinc-700" };

  return (
    <div className="group rounded-2xl border border-zinc-800 bg-zinc-900 p-4 transition hover:border-zinc-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 text-xl shrink-0">{meta.icon}</div>
          <div className="min-w-0">
            <p className="font-medium text-zinc-100 leading-snug">{place.name}</p>
            {place.brand && <p className="mt-0.5 text-xs text-zinc-500">{place.brand}</p>}
          </div>
        </div>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`}
          target="_blank"
          rel="noreferrer"
          aria-label={`View ${place.name} on map`}
          className="shrink-0 flex h-7 w-7 items-center justify-center rounded-xl border border-zinc-700 text-zinc-600 transition hover:border-brand-500/40 hover:text-brand-400"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Tags */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${meta.color}`}>
          {meta.label}
        </span>
        {place.cuisine && (
          <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[10px] text-zinc-500">
            {place.cuisine}
          </span>
        )}
        {place.openingHours && (
          <span className={`rounded-full border px-2 py-0.5 text-[10px] ${
            place.openingHours === "24/7"
              ? "border-success-500/30 bg-success-500/10 text-success-400"
              : "border-zinc-800 bg-zinc-950 text-zinc-500"
          }`}>
            {place.openingHours === "24/7" ? "Open 24/7" : `🕒 ${place.openingHours}`}
          </span>
        )}
        {place.highlights?.map((h) => (
          <span key={h} className="rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[10px] text-zinc-500">
            ✓ {h}
          </span>
        ))}
      </div>

      {/* Address */}
      {place.address && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-600">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{place.address}</span>
        </p>
      )}

      {/* Contact */}
      {(place.phone || place.website) && (
        <div className="mt-2.5 flex flex-wrap gap-3 border-t border-zinc-800/60 pt-2.5 text-xs">
          {place.phone && (
            <a href={`tel:${place.phone}`} className="flex items-center gap-1.5 text-brand-400 transition hover:text-brand-300">
              <Phone className="h-3 w-3" /> {place.phone}
            </a>
          )}
          {place.website && (
            <a href={normalizeExternalUrl(place.website)} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-brand-400 transition hover:text-brand-300">
              <Globe className="h-3 w-3" /> Website
            </a>
          )}
        </div>
      )}
    </div>
  );
}
