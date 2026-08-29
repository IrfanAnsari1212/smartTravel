import { formatDistance, formatDuration } from "../utils/formatters";

export default function OfflineTripLibrary({
  offlineTrips,
  offlineMapPacks,
  onOpenTrip,
  onExportTrip,
  onDeleteTrip,
  onRemoveMapPack,
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Offline Trip Library</h2>
        <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
          {offlineTrips.length} saved
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {offlineTrips.length ? (
          offlineTrips.map((trip) => (
            <div
              key={trip.id}
              className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onOpenTrip(trip)}
                  className="text-left"
                >
                  <p className="font-medium text-white">{trip.startQuery}</p>
                  <p className="text-sm text-slate-400">
                    to {trip.destinationQuery}
                  </p>
                </button>

                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
                  Offline
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                <span>{formatDistance(trip.distance)}</span>
                <span>{formatDuration(trip.duration)}</span>
                <span>{trip.places?.length || 0} stops</span>
                {offlineMapPacks.some((pack) => pack.id === trip.id) && (
                  <span className="text-emerald-200">map area cached</span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onOpenTrip(trip)}
                  className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200 transition hover:border-cyan-300 hover:text-cyan-100"
                >
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => onExportTrip(trip)}
                  className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200 transition hover:border-cyan-300 hover:text-cyan-100"
                >
                  Export
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteTrip(trip.id)}
                  className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200 transition hover:border-rose-300 hover:text-rose-100"
                >
                  Remove
                </button>
                {offlineMapPacks.some((pack) => pack.id === trip.id) && (
                  <button
                    type="button"
                    onClick={() => onRemoveMapPack(trip.id)}
                    className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200 transition hover:border-rose-300 hover:text-rose-100"
                  >
                    Remove Map
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-400">
            Save a planned trip to keep it on this device for offline use.
          </p>
        )}
      </div>
    </div>
  );
}

