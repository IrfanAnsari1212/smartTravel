import { EMERGENCY_SERVICE_CONFIG, buildMapsSearchUrl, formatDistance, normalizeExternalUrl } from "../../utils/formatters";
import { TriangleAlert, MapPin, Phone, Globe, Navigation, ChevronRight } from "lucide-react";

export default function EmergencyPanel({
  emergencyReferenceLabel,
  emergencyFallbacks,
  emergencyFallbackCount,
  nearestEmergencyOption,
  focusedSafetyPlace,
  setFocusedSafetyPlace,
}) {
  const openPlace = (place) => window.open(buildMapsSearchUrl(place), "_blank", "noopener,noreferrer");

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TriangleAlert className="h-4 w-4 text-danger-400" />
          <h3 className="text-sm font-semibold text-zinc-100">Emergency Fallback</h3>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${
          emergencyFallbackCount === EMERGENCY_SERVICE_CONFIG.length
            ? "border-success-500/30 bg-success-500/10 text-success-400"
            : emergencyFallbackCount > 0
              ? "border-warn-500/30 bg-warn-500/10 text-warn-400"
              : "border-danger-500/30 bg-danger-500/10 text-danger-400"
        }`}>
          {emergencyFallbackCount}/{EMERGENCY_SERVICE_CONFIG.length} ready
        </span>
      </div>

      <p className="text-xs text-zinc-600">
        Offline quick-access to nearest saved services from your {emergencyReferenceLabel}.
      </p>

      {/* Nearest highlight */}
      {nearestEmergencyOption && (
        <div className="rounded-2xl border border-danger-500/20 bg-danger-500/5 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-danger-500/80 mb-1">Nearest Now</p>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-100">{nearestEmergencyOption.label}</p>
              <p className="text-xs text-zinc-400 truncate">{nearestEmergencyOption.nearestPlace.name}</p>
              <p className="mt-0.5 text-[10px] text-zinc-600">
                {nearestEmergencyOption.nearestPlace.distanceFromReference != null
                  ? `${formatDistance(nearestEmergencyOption.nearestPlace.distanceFromReference)} from ${emergencyReferenceLabel}`
                  : "Saved in route pack"}
              </p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button type="button" onClick={() => setFocusedSafetyPlace(nearestEmergencyOption.nearestPlace)}
                className="flex h-7 items-center gap-1 rounded-lg border border-zinc-700 px-2 text-xs text-zinc-400 transition hover:border-danger-500/40 hover:text-danger-400">
                <Navigation className="h-3 w-3" />
              </button>
              {nearestEmergencyOption.nearestPlace.phone && (
                <a href={`tel:${nearestEmergencyOption.nearestPlace.phone}`}
                  className="flex h-7 items-center gap-1 rounded-lg border border-zinc-700 px-2 text-xs text-zinc-400 transition hover:border-success-500/40 hover:text-success-400">
                  <Phone className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Service grid */}
      <div className="grid grid-cols-2 gap-2">
        {emergencyFallbacks.map((service) => {
          const place = service.nearestPlace;
          const isFocused = focusedSafetyPlace?.id === place?.id;

          return (
            <div key={service.id}
              className={`rounded-2xl border p-3 transition ${
                isFocused
                  ? "border-danger-500/40 bg-danger-500/5"
                  : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
              }`}>
              <div className="flex items-start justify-between gap-1 mb-2">
                <p className="text-xs font-medium text-zinc-200">{service.label}</p>
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                  place
                    ? "bg-success-500/15 text-success-400"
                    : "bg-zinc-800 text-zinc-600"
                }`}>
                  {place ? "✓" : "—"}
                </span>
              </div>

              {place ? (
                <>
                  <p className="text-[10px] text-zinc-400 truncate leading-snug">{place.name}</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">
                    {place.distanceFromReference != null
                      ? formatDistance(place.distanceFromReference)
                      : "Saved"}
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    <button type="button" onClick={() => setFocusedSafetyPlace(place)}
                      className="flex h-6 items-center rounded-lg border border-zinc-700 px-2 text-[10px] text-zinc-500 transition hover:border-brand-500/40 hover:text-brand-400">
                      Focus
                    </button>
                    {place.phone && (
                      <a href={`tel:${place.phone}`}
                        className="flex h-6 items-center rounded-lg border border-zinc-700 px-2 text-[10px] text-zinc-500 transition hover:border-success-500/40 hover:text-success-400">
                        Call
                      </a>
                    )}
                    <button type="button" onClick={() => openPlace(place)}
                      className="ml-auto flex h-6 w-6 items-center justify-center rounded-lg border border-zinc-700 text-zinc-600 hover:text-zinc-400">
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-[10px] text-zinc-700 leading-snug mt-1">{service.emptyLabel}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
