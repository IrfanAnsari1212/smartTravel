import { useState, useEffect } from "react";
import { formatDistance, formatDuration } from "../../utils/formatters";
import { fetchRouteWeather } from "../../services/weatherService";
import WeatherWidget from "../weather/WeatherWidget";
import WeatherAlertsBanner from "../weather/WeatherAlertsBanner";
import { Route, Clock, MapPin, ChevronDown, ChevronUp } from "lucide-react";

export default function TripSummaryPanel({ route, start, destination }) {
  const [routeWeather, setRouteWeather] = useState(null);
  const [showWeather, setShowWeather] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (route?.start && route?.destination) {
      fetchRouteWeather({
        start: route.start,
        destination: route.destination,
        waypoints: route.waypoints || [],
        stops: (route.days || []).flatMap((d) => d.stops || []),
      })
        .then((data) => { if (isMounted) setRouteWeather(data); })
        .catch((err) => console.error("Route weather failed:", err));
    }
    return () => { isMounted = false; };
  }, [route]);

  if (!route) return null;

  const waypointCount = route.waypoints?.length || 0;
  const placeCount = route.places?.length || 0;

  return (
    <div className="space-y-3">
      {/* Weather alerts */}
      {routeWeather?.severeWarnings?.length > 0 && (
        <WeatherAlertsBanner warnings={routeWeather.severeWarnings} />
      )}

      {/* Summary card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        {/* Route label */}
        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
          <Route className="h-3.5 w-3.5" />
          <span className="truncate">
            {start?.split(",")[0] || "Start"} → {destination?.split(",")[0] || "Destination"}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-zinc-950 border border-zinc-800/60 px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">Distance</p>
            <p className="mt-1.5 text-2xl font-bold text-zinc-100 leading-none">
              {formatDistance(route.distance)}
            </p>
          </div>
          <div className="rounded-xl bg-zinc-950 border border-zinc-800/60 px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">Duration</p>
            <p className="mt-1.5 text-2xl font-bold text-zinc-100 leading-none">
              {formatDuration(route.duration)}
            </p>
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-600">
          {waypointCount > 0 && <span>{waypointCount} waypoint{waypointCount !== 1 ? "s" : ""}</span>}
          {placeCount > 0 && <span>{placeCount} places found</span>}
          {route.filters?.length > 0 && <span>Filters: {route.filters.join(", ")}</span>}
        </div>
      </div>

      {/* Weather toggle */}
      {route.destination?.lat && route.destination?.lon && (
        <div>
          <button
            type="button"
            onClick={() => setShowWeather((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs font-medium text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
          >
            <span>🌤 Destination Weather</span>
            {showWeather ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {showWeather && (
            <div className="mt-2">
              <WeatherWidget
                lat={route.destination.lat}
                lon={route.destination.lon}
                name={route.destination.name || destination}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
