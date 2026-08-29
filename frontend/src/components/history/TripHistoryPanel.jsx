import { formatDistance, formatDuration } from "../../utils/formatters";

export default function TripHistoryPanel({
  history,
  historyLoading,
  isOnline,
  onRefresh,
  onApplyTrip,
  onToggleFavorite,
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Recent Trips</h2>
        <button
          type="button"
          onClick={onRefresh}
          disabled={!isOnline}
          className="text-sm text-cyan-200 transition hover:text-cyan-100 disabled:text-slate-500"
        >
          Refresh
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {historyLoading ? (
          <p className="text-sm text-slate-400">Loading history...</p>
        ) : history.length ? (
          history.map((trip) => (
            <div
              key={trip.id}
              className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onApplyTrip(trip)}
                  className="text-left"
                >
                  <p className="font-medium text-white">{trip.startQuery}</p>
                  <p className="text-sm text-slate-400">
                    to {trip.destinationQuery}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => onToggleFavorite(trip.id)}
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    trip.favorite
                      ? "bg-amber-300/20 text-amber-100"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {trip.favorite ? "Favorite" : "Save"}
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                <span>{formatDistance(trip.distance)}</span>
                <span>{formatDuration(trip.duration)}</span>
                <span>{trip.places?.length || 0} stops</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-400">
            {isOnline
              ? "Your planned trips will appear here."
              : "Trip history is available again when the network returns."}
          </p>
        )}
      </div>
    </div>
  );
}

