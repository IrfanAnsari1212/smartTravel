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
        <h2 className="text-lg font-bold text-white">Recent Trips</h2>
        <button
          type="button"
          aria-label="Refresh recent trips list"
          onClick={onRefresh}
          disabled={!isOnline}
          className="rounded-xl px-3 py-1.5 text-xs font-semibold text-cyan-300 transition hover:bg-slate-800 hover:text-cyan-200 disabled:text-slate-600 min-h-[40px] flex items-center"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {historyLoading ? (
          <p className="text-xs text-slate-400">Loading history...</p>
        ) : history.length ? (
          history.map((trip) => (
            <div
              key={trip.id}
              className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  aria-label={`Load trip from ${trip.startQuery} to ${trip.destinationQuery}`}
                  onClick={() => onApplyTrip(trip)}
                  className="text-left flex-1 min-h-[44px] flex flex-col justify-center"
                >
                  <p className="font-semibold text-white text-xs sm:text-sm">{trip.startQuery}</p>
                  <p className="text-xs text-slate-400">
                    to {trip.destinationQuery}
                  </p>
                </button>

                <button
                  type="button"
                  aria-label={trip.favorite ? "Remove from favorite trips" : "Save as favorite trip"}
                  onClick={() => onToggleFavorite(trip.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition min-h-[40px] flex items-center ${
                    trip.favorite
                      ? "bg-amber-300/20 text-amber-200 border border-amber-400/40"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {trip.favorite ? "★ Favorited" : "☆ Save"}
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                <span className="rounded-md bg-slate-900 px-2 py-0.5">{formatDistance(trip.distance)}</span>
                <span className="rounded-md bg-slate-900 px-2 py-0.5">{formatDuration(trip.duration)}</span>
                <span className="rounded-md bg-slate-900 px-2 py-0.5">{trip.places?.length || 0} stops</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-400">
            {isOnline
              ? "Your planned trips will appear here."
              : "Trip history is available again when the network returns."}
          </p>
        )}
      </div>
    </div>
  );
}
