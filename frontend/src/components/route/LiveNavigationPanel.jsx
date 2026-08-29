import { formatDistance, formatSpeed } from "../../utils/formatters";

export default function LiveNavigationPanel({
  navigationState,
  startTrip,
  stopTrip,
  liveDistanceToDestination,
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-200">Live Trip Mode</p>
          <p className="mt-2 text-sm text-slate-400">
            Start navigation to follow your real-time location on the map during
            the journey.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {!navigationState.isActive ? (
            <button
              type="button"
              onClick={startTrip}
              className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-300"
            >
              Start Trip
            </button>
          ) : (
            <button
              type="button"
              onClick={() => stopTrip("idle", "")}
              className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-rose-300 hover:text-rose-100"
            >
              Stop Trip
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-900 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Status</p>
          <p className="mt-2 text-lg font-semibold text-white">
            {navigationState.status === "tracking"
              ? "Tracking live"
              : navigationState.status === "requesting"
                ? "Requesting access"
                : navigationState.status === "error"
                  ? "Location error"
                  : "Ready"}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-900 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Speed</p>
          <p className="mt-2 text-lg font-semibold text-white">
            {formatSpeed(navigationState.currentLocation?.speed)}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-900 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Accuracy</p>
          <p className="mt-2 text-lg font-semibold text-white">
            {navigationState.currentLocation
              ? `${Math.round(navigationState.currentLocation.accuracy)} m`
              : "Waiting..."}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-900 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
            Destination Range
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            {liveDistanceToDestination
              ? formatDistance(liveDistanceToDestination)
              : "Waiting..."}
          </p>
        </div>
      </div>

      {navigationState.error && (
        <p className="mt-3 text-sm text-rose-200">{navigationState.error}</p>
      )}
    </div>
  );
}

