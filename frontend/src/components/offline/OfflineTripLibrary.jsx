import { formatDistance } from "../../utils/formatters";
import { WifiOff, Download, Trash2, Upload, Cloud, HardDrive, ChevronRight, Loader } from "lucide-react";

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
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Offline Trips</h2>
            <p className="mt-0.5 text-xs text-zinc-600">
              {offlineTrips.length} saved device pack{offlineTrips.length !== 1 ? "s" : ""}
            </p>
          </div>
          {offlineTrips.length > 0 && (
            <button type="button" onClick={onExportAllTrips}
              className="flex h-8 items-center gap-1.5 rounded-xl border border-zinc-800 px-3 text-xs text-zinc-500 transition hover:border-zinc-700 hover:text-zinc-300">
              <Download className="h-3.5 w-3.5" />
              Export all
            </button>
          )}
        </div>
      </div>

      {/* Offline status banner */}
      {!isOnline && (
        <div className="flex items-center gap-3 rounded-2xl border border-warn-500/30 bg-warn-500/10 px-4 py-3">
          <WifiOff className="h-4 w-4 text-warn-400 shrink-0" />
          <p className="text-xs text-warn-400">
            You're offline. Only locally saved trips are available.
          </p>
        </div>
      )}

      {/* Trips */}
      {offlineTrips.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800">
            <HardDrive className="h-6 w-6 text-zinc-700" />
          </div>
          <p className="text-sm text-zinc-500">No offline trips yet</p>
          <p className="text-xs text-zinc-700">Plan a route and use "Save Offline" to keep it on this device</p>
        </div>
      ) : (
        <div className="space-y-2">
          {offlineTrips.map((trip) => {
            const isSyncing = syncingTripId === trip.id;
            const isSynced = trip.syncStatus === "synced" || trip.tripId;

            return (
              <div key={trip.id} className="group rounded-2xl border border-zinc-800 bg-zinc-900 p-4 transition hover:border-zinc-700">
                {/* Route name */}
                <button type="button" onClick={() => onOpenTrip(trip)} className="w-full text-left">
                  <div className="flex items-center gap-2">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success-500/20">
                      <div className="h-1.5 w-1.5 rounded-full bg-success-400" />
                    </div>
                    <p className="text-xs text-zinc-500 truncate">{trip.startQuery || "Start"}</p>
                  </div>
                  <div className="ml-2 my-1 h-2.5 w-px bg-zinc-700" />
                  <p className="ml-6 text-sm font-medium text-zinc-100 truncate">
                    {trip.destinationQuery || "Destination"}
                  </p>
                </button>

                {/* Badges */}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="flex items-center gap-1 rounded-full border border-success-500/30 bg-success-500/10 px-2 py-0.5 text-[10px] text-success-400">
                    ✓ Offline Ready
                  </span>
                  {isSynced ? (
                    <span className="flex items-center gap-1 rounded-full border border-brand-500/30 bg-brand-950/50 px-2 py-0.5 text-[10px] text-brand-400">
                      <Cloud className="h-2.5 w-2.5" /> Cloud Synced
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">
                      <HardDrive className="h-2.5 w-2.5" /> Local only
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-zinc-600">
                  {trip.distance && <span>{formatDistance(trip.distance)}</span>}
                  {trip.places?.length > 0 && <span>{trip.places.length} places</span>}
                  {trip.savedAt && (
                    <span>Saved {new Date(trip.savedAt).toLocaleDateString()}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-zinc-800/60 pt-3">
                  <button type="button" onClick={() => onOpenTrip(trip)}
                    className="flex h-7 items-center gap-1 rounded-lg bg-zinc-800 px-3 text-xs text-zinc-300 transition hover:bg-zinc-700">
                    Open <ChevronRight className="h-3 w-3" />
                  </button>
                  {isOnline && !isSynced && onSyncTripToCloud && (
                    <button type="button" onClick={() => onSyncTripToCloud(trip)} disabled={isSyncing}
                      className="flex h-7 items-center gap-1 rounded-lg border border-brand-800/40 bg-brand-950/30 px-3 text-xs text-brand-400 transition hover:bg-brand-950/50 disabled:opacity-50">
                      {isSyncing ? <Loader className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                      {isSyncing ? "Syncing…" : "Sync"}
                    </button>
                  )}
                  <button type="button" onClick={() => onExportTrip?.(trip)}
                    className="flex h-7 items-center gap-1 rounded-lg border border-zinc-800 px-3 text-xs text-zinc-600 transition hover:border-zinc-700 hover:text-zinc-400">
                    <Download className="h-3 w-3" /> Export
                  </button>
                  <button type="button" onClick={() => onDeleteTrip(trip.id)}
                    className="ml-auto flex h-7 items-center gap-1 rounded-lg border border-zinc-800 px-2 text-xs text-zinc-700 transition hover:border-danger-500/30 hover:text-danger-400">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Map packs */}
      {offlineMapPacks?.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-zinc-700">Cached Map Areas</p>
          <div className="space-y-2">
            {offlineMapPacks.map((pack) => (
              <div key={pack.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
                <div>
                  <p className="text-xs font-medium text-zinc-300">{pack.label || pack.id}</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">
                    {pack.tileCount} tiles · {pack.areaBounds ? "Bounded area" : "Route corridor"}
                  </p>
                </div>
                <button type="button" onClick={() => onRemoveMapPack(pack.id)}
                  className="rounded-lg p-1.5 text-zinc-700 transition hover:text-danger-400">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
