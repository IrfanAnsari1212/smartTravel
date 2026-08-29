import { formatDistance, formatDuration } from "../utils/formatters";

export default function TripSummaryPanel({ route, start, destination }) {
  if (!route) {
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Trip Summary</h2>
        <p className="text-sm text-slate-400">
          Plan a route online or open an offline trip pack to inspect the route,
          stops, and drive estimates.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-white">Trip Summary</h2>
        <p className="mt-2 text-sm text-slate-300">
          {start} to {destination}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-950 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
            Distance
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {formatDistance(route.distance)}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-950 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
            Duration
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {formatDuration(route.duration)}
          </p>
        </div>
      </div>
    </div>
  );
}
