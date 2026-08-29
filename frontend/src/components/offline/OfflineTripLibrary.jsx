import { formatDistance, formatDuration } from "../../utils/formatters";

export default function OfflineTripLibrary({
  offlineTrips,
  offlineMapPacks,
  syncingTripId,
  isOnline,
  onOpenTrip,
  onExportTrip,
  onExportAllTrips,
  onDeleteTrip,
  onRemoveMapPack,
  onSyncTripToCloud,
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Offline Trip Library & Backup</h2>
          <p className="mt-1 text-xs text-slate-400">
            Export, import, and sync your route packs across devices with SHA-256 integrity verification.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {offlineTrips.length > 0 && (
            <button
              type="button"
              onClick={onExportAllTrips}
              className="rounded-full border border-slate-700 bg-slate-800/80 px-3.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-400 hover:bg-slate-700 hover:text-white"
            >
              📦 Export Full Backup ({offlineTrips.length})
            </button>
          )}
          <span className="rounded-full bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-100">
            {offlineTrips.length} saved
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {offlineTrips.length ? (
          offlineTrips.map((trip) => {
            const isSyncing = syncingTripId === trip.id;
            const isCloudSynced = trip.syncStatus === "synced" || trip.tripId;

            return (
              <div
                key={trip.id}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-4 transition hover:border-slate-700"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onOpenTrip(trip)}
                    className="text-left"
                  >
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white">{trip.startQuery}</p>
                      <span className="text-slate-500">→</span>
                      <p className="font-semibold text-white">{trip.destinationQuery}</p>
                    </div>
                    {trip.savedAt && (
                      <p className="mt-1 text-xs text-slate-400">
                        Saved {new Date(trip.savedAt).toLocaleDateString()} at{" "}
                        {new Date(trip.savedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Sync Status Badge */}
                    {isCloudSynced ? (
                      <span className="flex items-center gap-1 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-0.5 text-[11px] font-medium text-cyan-200">
                        ☁️ Synced to Cloud
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-200">
                        💾 Local Device Only
                      </span>
                    )}

                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-200">
                      ✓ Offline Ready
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="text-slate-300 font-medium">{formatDistance(trip.distance)}</span>
                  <span>•</span>
                  <span>{formatDuration(trip.duration)}</span>
                  <span>•</span>
                  <span>{trip.places?.length || 0} stops bundle</span>
                  {trip.checksum && (
                    <>
                      <span>•</span>
                      <span className="text-[10px] text-slate-500">
                        SHA-256: {trip.checksum.slice(0, 8)}...
                      </span>
                    </>
                  )}
                  {offlineMapPacks.some((pack) => pack.id === trip.id) && (
                    <span className="ml-auto rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-200">
                      🗺️ Map Tiles Cached
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-slate-800/80 pt-3">
                  <button
                    type="button"
                    onClick={() => onOpenTrip(trip)}
                    className="rounded-full border border-slate-700 bg-slate-900 px-3.5 py-1 text-xs font-medium text-slate-200 transition hover:border-cyan-400 hover:text-cyan-100"
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => onExportTrip(trip)}
                    className="rounded-full border border-slate-700 bg-slate-900 px-3.5 py-1 text-xs font-medium text-slate-200 transition hover:border-cyan-400 hover:text-cyan-100"
                  >
                    Export Pack (v2)
                  </button>

                  {/* Sync to Cloud button for local-only trips */}
                  {!isCloudSynced && onSyncTripToCloud && (
                    <button
                      type="button"
                      disabled={isSyncing || !isOnline}
                      onClick={() => onSyncTripToCloud(trip)}
                      className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3.5 py-1 text-xs font-medium text-amber-200 transition hover:border-amber-400 hover:bg-amber-500/20 disabled:opacity-50"
                    >
                      {isSyncing ? "Syncing..." : "☁️ Sync to Cloud"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onDeleteTrip(trip.id)}
                    className="rounded-full border border-slate-700 bg-slate-900 px-3.5 py-1 text-xs font-medium text-slate-400 transition hover:border-rose-400 hover:text-rose-200"
                  >
                    Remove
                  </button>

                  {offlineMapPacks.some((pack) => pack.id === trip.id) && (
                    <button
                      type="button"
                      onClick={() => onRemoveMapPack(trip.id)}
                      className="ml-auto rounded-full border border-rose-500/30 px-3 py-1 text-xs font-medium text-rose-300 transition hover:border-rose-400 hover:bg-rose-500/10"
                    >
                      Remove Map Area
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-800 px-4 py-6 text-sm text-slate-400">
            Save a planned trip to keep it on this device for offline use, or click "Import Offline Pack" above to restore a saved JSON file.
          </p>
        )}
      </div>
    </div>
  );
}
