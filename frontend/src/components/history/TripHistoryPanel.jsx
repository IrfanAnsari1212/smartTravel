import { Clock, Star, MapPin, Navigation, Loader, RefreshCw, ChevronRight } from "lucide-react";

export default function TripHistoryPanel({
  history,
  historyLoading,
  isOnline,
  onRefresh,
  onApplyTrip,
  onToggleFavorite,
}) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">My Trips</h2>
          <p className="text-xs text-zinc-600 mt-0.5">
            {history.length > 0 ? `${history.length} saved journey${history.length !== 1 ? "s" : ""}` : "No trips yet"}
          </p>
        </div>
        {isOnline && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={historyLoading}
            aria-label="Refresh trip history"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 text-zinc-600 transition hover:border-zinc-700 hover:text-zinc-400 disabled:opacity-40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${historyLoading ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>

      {!isOnline && (
        <div className="rounded-xl border border-warn-500/30 bg-warn-500/10 px-3 py-2.5 text-xs text-warn-400">
          Trip history requires internet connection.
        </div>
      )}

      {historyLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-xs text-zinc-600">
          <Loader className="h-4 w-4 animate-spin" />
          Loading trips…
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800">
            <Navigation className="h-6 w-6 text-zinc-700" />
          </div>
          <p className="text-sm text-zinc-500">No saved trips yet</p>
          <p className="text-xs text-zinc-700">Plan your first route to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onApply={() => onApplyTrip(trip)}
              onFavorite={() => onToggleFavorite(trip.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TripCard({ trip, onApply, onFavorite }) {
  const distanceKm = trip.distance ? (trip.distance / 1000).toFixed(0) : null;
  const durationH = trip.duration ? Math.round(trip.duration / 3600) : null;
  const stopCount = (trip.waypoints?.length || 0) + 2;

  return (
    <div className="group rounded-2xl border border-zinc-800 bg-zinc-900 p-4 transition hover:border-zinc-700">
      {/* Route names */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success-500/20">
              <div className="h-1.5 w-1.5 rounded-full bg-success-400" />
            </div>
            <p className="truncate text-xs text-zinc-400">
              {trip.startQuery || trip.start?.name?.split(",")[0] || "Start"}
            </p>
          </div>
          <div className="ml-2 my-1 h-3 w-px bg-zinc-700" />
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-danger-500/70" />
            <p className="truncate text-sm font-medium text-zinc-100">
              {trip.destinationQuery || trip.destination?.name?.split(",")[0] || "Destination"}
            </p>
          </div>
        </div>

        {/* Favorite */}
        <button
          type="button"
          onClick={onFavorite}
          aria-label={trip.favorite ? "Remove from favorites" : "Add to favorites"}
          className="shrink-0 rounded-lg p-1 transition hover:bg-zinc-800"
        >
          <Star
            className={`h-4 w-4 transition ${trip.favorite ? "fill-warn-400 text-warn-400" : "text-zinc-700 hover:text-zinc-500"}`}
          />
        </button>
      </div>

      {/* Stats row */}
      <div className="mt-3 flex items-center gap-3 text-[11px] text-zinc-600">
        {distanceKm && (
          <span className="flex items-center gap-1">
            <span className="text-zinc-700">📍</span> {distanceKm} km
          </span>
        )}
        {durationH && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> ~{durationH}h
          </span>
        )}
        <span>{stopCount} stops</span>
        {trip.favorite && (
          <span className="ml-auto flex items-center gap-1 text-warn-600">
            <Star className="h-3 w-3 fill-warn-600" /> Favorite
          </span>
        )}
      </div>

      {/* Action */}
      <button
        type="button"
        onClick={onApply}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 py-2 text-xs font-medium text-zinc-300 transition hover:border-brand-500/40 hover:bg-brand-950/30 hover:text-brand-300 group-hover:border-zinc-600"
      >
        Open Trip
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
