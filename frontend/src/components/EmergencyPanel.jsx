import {
  EMERGENCY_SERVICE_CONFIG,
  buildMapsSearchUrl,
  formatDistance,
  normalizeExternalUrl,
} from "../utils/formatters";

export default function EmergencyPanel({
  emergencyReferenceLabel,
  emergencyFallbacks,
  emergencyFallbackCount,
  nearestEmergencyOption,
  focusedSafetyPlace,
  setFocusedSafetyPlace,
}) {
  const focusSafetyPlace = (place) => {
    setFocusedSafetyPlace(place);
  };

  const openSafetyPlace = (place) => {
    window.open(buildMapsSearchUrl(place), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-200">Emergency fallback</p>
          <p className="mt-2 text-sm text-slate-400">
            Offline quick-access to the nearest saved fuel, hotel, hospital, and
            mechanic from your {emergencyReferenceLabel}.
          </p>
        </div>
        <span className="rounded-full bg-rose-400/10 px-3 py-1 text-xs text-rose-100">
          {emergencyFallbackCount}/{EMERGENCY_SERVICE_CONFIG.length} ready
        </span>
      </div>

      {nearestEmergencyOption && (
        <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/5 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-rose-100">
                Nearest now: {nearestEmergencyOption.label}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {nearestEmergencyOption.nearestPlace.name}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {nearestEmergencyOption.nearestPlace.distanceFromReference !== null &&
                nearestEmergencyOption.nearestPlace.distanceFromReference !== undefined
                  ? `${formatDistance(
                      nearestEmergencyOption.nearestPlace.distanceFromReference
                    )} from your ${emergencyReferenceLabel}`
                  : "Saved in this route pack"}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => focusSafetyPlace(nearestEmergencyOption.nearestPlace)}
                className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-rose-300 hover:text-rose-100"
              >
                Focus Nearest
              </button>
              {nearestEmergencyOption.nearestPlace.phone && (
                <a
                  href={`tel:${nearestEmergencyOption.nearestPlace.phone}`}
                  className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-rose-300 hover:text-rose-100"
                >
                  Call Nearest
                </a>
              )}
              <button
                type="button"
                onClick={() => openSafetyPlace(nearestEmergencyOption.nearestPlace)}
                className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-rose-300 hover:text-rose-100"
              >
                Open Nearest
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {emergencyFallbacks.map((service) => {
          const place = service.nearestPlace;

          return (
            <div
              key={service.id}
              className={`rounded-2xl border bg-slate-900 p-4 ${
                place && focusedSafetyPlace?.id === place.id
                  ? "border-rose-300/60"
                  : "border-slate-800"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">{service.label}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500">
                    {service.count} saved
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs ${
                    place
                      ? "bg-emerald-400/15 text-emerald-100"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {place ? "Available" : "Missing"}
                </span>
              </div>

              {place ? (
                <>
                  <p className="mt-4 font-medium text-slate-100">{place.name}</p>
                  <p className="mt-2 text-sm text-slate-400">
                    {place.address || "Address details unavailable"}
                  </p>
                  <p className="mt-2 text-sm text-cyan-100">
                    {place.distanceFromReference !== null &&
                    place.distanceFromReference !== undefined
                      ? `${formatDistance(place.distanceFromReference)} away`
                      : "Saved to this route pack"}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-3 text-sm">
                    <button
                      type="button"
                      onClick={() => focusSafetyPlace(place)}
                      className="text-cyan-200 transition hover:text-cyan-100"
                    >
                      Focus
                    </button>
                    {place.phone && (
                      <a
                        href={`tel:${place.phone}`}
                        className="text-cyan-200 transition hover:text-cyan-100"
                      >
                        Call
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
                    <button
                      type="button"
                      onClick={() => openSafetyPlace(place)}
                      className="text-cyan-200 transition hover:text-cyan-100"
                    >
                      Open
                    </button>
                  </div>
                </>
              ) : (
                <p className="mt-4 text-sm text-slate-400">
                  {service.emptyLabel}. Plan the route online again to refresh the
                  safety pack.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
