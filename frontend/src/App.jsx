import { useEffect, useRef, useState } from "react";
import MapView from "./components/MapView";
import { searchPlaces } from "./services/locationService";
import {
  getTripHistory,
  planTripRequest,
  toggleFavoriteTrip,
} from "./services/tripService";

const PLACE_FILTERS = [
  { id: "restaurant", label: "Restaurants" },
  { id: "hotel", label: "Hotels" },
  { id: "fuel", label: "Fuel" },
];

const formatDistance = (distance) => `${(distance / 1000).toFixed(1)} km`;
const formatDuration = (duration) => `${(duration / 3600).toFixed(1)} hrs`;

const tripFromHistory = (trip) => ({
  tripId: trip.id,
  start: trip.start,
  destination: trip.destination,
  distance: trip.distance,
  duration: trip.duration,
  geometry: trip.geometry,
  places: trip.places,
  filters: trip.filters,
});

function App() {
  const [start, setStart] = useState("");
  const [destination, setDestination] = useState("");
  const [route, setRoute] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const [historyLoading, setHistoryLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState(
    PLACE_FILTERS.map((filter) => filter.id)
  );

  const searchTimeouts = useRef({});

  const loadTripHistory = async () => {
    setHistoryLoading(true);
    try {
      const trips = await getTripHistory();
      setHistory(trips);
    } catch (error) {
      console.error(error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadTripHistory();

    // Cleanup function to clear timeouts if component unmounts
    return () => {
      Object.values(searchTimeouts.current).forEach(clearTimeout);
    };
  }, []);

  const handleSearch = (value, setter, key) => {
    clearTimeout(searchTimeouts.current[key]);

    if (!value.trim()) {
      setter([]);
      return;
    }

    searchTimeouts.current[key] = setTimeout(async () => {
      try {
        const results = await searchPlaces(value);
        setter(results);
      } catch (error) {
        console.error("Search failed:", error);
      }
    }, 300);
  };

  const toggleFilter = (filterId) => {
    setSelectedFilters((current) => {
      if (current.includes(filterId)) {
        return current.length === 1
          ? current
          : current.filter((item) => item !== filterId);
      }
      return [...current, filterId];
    });
  };

  const planTrip = async () => {
    if (!start.trim() || !destination.trim()) {
      setErrorMessage("Enter both locations to plan a trip.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const plannedTrip = await planTripRequest({
        start,
        destination,
        filters: selectedFilters,
      });

      setRoute(plannedTrip);
      await loadTripHistory();
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error.response?.data?.message || "Unable to plan the trip right now."
      );
    } finally {
      setLoading(false);
    }
  };

  const applyHistoryTrip = (trip) => {
    setStart(trip.startQuery);
    setDestination(trip.destinationQuery);
    setSelectedFilters(trip.filters?.length ? trip.filters : selectedFilters);
    setRoute(tripFromHistory(trip));
    setStartSuggestions([]);
    setDestSuggestions([]);
    setErrorMessage("");
  };

  const handleFavoriteToggle = async (tripId) => {
    try {
      const updatedTrip = await toggleFavoriteTrip(tripId);

      setHistory((current) =>
        current
          .map((trip) => (trip.id === tripId ? updatedTrip : trip))
          .sort((a, b) => Number(b.favorite) - Number(a.favorite))
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
        <section className="rounded-3xl border border-cyan-500/20 bg-linear-to-br from-slate-900 via-slate-900 to-cyan-950/60 p-6 shadow-2xl shadow-cyan-950/30">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">
                Route Planning Platform
              </p>
              <h1 className="max-w-3xl text-4xl font-semibold text-white md:text-5xl">
                Plan a route, surface the best road-trip stops, and keep a live
                history of where you have explored.
              </h1>
              <p className="max-w-2xl text-sm text-slate-300 md:text-base">
                This version now searches through the backend, saves recent
                itineraries, and lets you focus recommendations on the stop
                types you care about.
              </p>
            </div>

            <div className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4 md:grid-cols-[1fr_1fr_auto]">
              <div className="relative">
                <label className="mb-2 block text-sm text-slate-300">
                  Start
                </label>
                <input
                  placeholder="Enter a starting city or address"
                  value={start}
                  onChange={(event) => {
                    const value = event.target.value;
                    setStart(value);
                    handleSearch(value, setStartSuggestions, "start");
                  }}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400"
                />

                {startSuggestions.length > 0 && (
                  <div className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-xl">
                    {startSuggestions.map((item) => (
                      <button
                        key={item.placeId}
                        type="button"
                        className="w-full border-b border-slate-800 px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-slate-800"
                        onClick={() => {
                          setStart(item.displayName);
                          setStartSuggestions([]);
                        }}
                      >
                        {item.displayName}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="mb-2 block text-sm text-slate-300">
                  Destination
                </label>
                <input
                  placeholder="Enter your destination"
                  value={destination}
                  onChange={(event) => {
                    const value = event.target.value;
                    setDestination(value);
                    handleSearch(value, setDestSuggestions, "destination");
                  }}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400"
                />

                {destSuggestions.length > 0 && (
                  <div className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-xl">
                    {destSuggestions.map((item) => (
                      <button
                        key={item.placeId}
                        type="button"
                        className="w-full border-b border-slate-800 px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-slate-800"
                        onClick={() => {
                          setDestination(item.displayName);
                          setDestSuggestions([]);
                        }}
                      >
                        {item.displayName}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={planTrip}
                  disabled={loading}
                  className="w-full rounded-2xl bg-cyan-400 px-6 py-3 font-medium text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-cyan-800 disabled:text-slate-300 md:w-auto"
                >
                  {loading ? "Planning..." : "Plan Trip"}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {PLACE_FILTERS.map((filter) => {
                const active = selectedFilters.includes(filter.id);
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => toggleFilter(filter.id)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      active
                        ? "border-cyan-300 bg-cyan-400/15 text-cyan-100"
                        : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>

            {errorMessage && (
              <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {errorMessage}
              </div>
            )}
          </div>
        </section>

        <section className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,420px)]">
          <div className="min-h-[480px] overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
            <MapView route={route} />
          </div>
          <div className="grid gap-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5">
              {!route ? (
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold text-white">
                    Trip Summary
                  </h2>
                  <p className="text-sm text-slate-400">
                    Plan a route to see drive time, distance, and curated stops
                    along the way.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      Trip Summary
                    </h2>
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

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    <p className="text-sm font-medium text-slate-200">
                      Stop filters
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      {(route.filters || selectedFilters).join(", ")}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">
                        Recommended Stops
                      </h3>
                      <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
                        {route.places?.length || 0} stops
                      </span>
                    </div>

                    {route.places?.length ? (
                      route.places.map((place) => (
                        <div
                          key={place.id}
                          className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-white">
                                {place.name}
                              </p>
                              <p className="mt-1 text-xs uppercase tracking-[0.25em] text-cyan-200">
                                {place.category}
                              </p>
                            </div>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200 transition hover:border-cyan-300 hover:text-cyan-100"
                            >
                              Open
                            </a>
                          </div>

                          <p className="mt-3 text-sm text-slate-400">
                            {place.address || "Address details unavailable"}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-2xl border border-dashed border-slate-700 px-4 py-6 text-sm text-slate-400">
                        No stops matched the selected filters on this route.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                  Recent Trips
                </h2>
                <button
                  type="button"
                  onClick={loadTripHistory}
                  className="text-sm text-cyan-200 transition hover:text-cyan-100"
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
                          onClick={() => applyHistoryTrip(trip)}
                          className="text-left"
                        >
                          <p className="font-medium text-white">
                            {trip.startQuery}
                          </p>
                          <p className="text-sm text-slate-400">
                            to {trip.destinationQuery}
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleFavoriteToggle(trip.id)}
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
                    Your planned trips will appear here.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;