import { useState } from "react";
import { PLACE_FILTERS } from "../../utils/formatters";

export default function RoutePlannerForm({
  start,
  setStart,
  destination,
  setDestination,
  waypoints = [],
  addWaypoint,
  removeWaypoint,
  updateWaypoint,
  moveWaypointUp,
  moveWaypointDown,
  avoidTolls = false,
  setAvoidTolls,
  avoidHighways = false,
  setAvoidHighways,
  optimize = false,
  setOptimize,
  startSuggestions,
  destSuggestions,
  selectedFilters,
  toggleFilter,
  handleSearch,
  clearSearchState,
  setStartSuggestions,
  setDestSuggestions,
  planTrip,
  loading,
  isOnline,
  errorMessage,
  currentOfflinePack,
  onImportClick,
  onSaveOffline,
  onDownloadPack,
  locationStatus,
  locationMessage,
  recentSearches = [],
  detectCurrentLocation,
  addRecentSearch,
}) {
  const [startFocused, setStartFocused] = useState(false);
  const [destFocused, setDestFocused] = useState(false);
  const [waypointFocusIndex, setWaypointFocusIndex] = useState(null);
  const [waypointSuggestionsMap, setWaypointSuggestionsMap] = useState({});
  const [startHighlightIndex, setStartHighlightIndex] = useState(-1);
  const [destHighlightIndex, setDestHighlightIndex] = useState(-1);

  const handleStartKeyDown = (e) => {
    const list = startSuggestions.length
      ? startSuggestions
      : startFocused && !start.trim()
        ? recentSearches.map((s) => ({ displayName: s, placeId: s }))
        : [];

    if (!list.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setStartHighlightIndex((prev) => (prev < list.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setStartHighlightIndex((prev) => (prev > 0 ? prev - 1 : list.length - 1));
    } else if (e.key === "Enter" && startHighlightIndex >= 0 && list[startHighlightIndex]) {
      e.preventDefault();
      const selected = list[startHighlightIndex];
      setStart(selected.displayName);
      if (addRecentSearch) addRecentSearch(selected.displayName);
      clearSearchState("start", setStartSuggestions);
      setStartHighlightIndex(-1);
    } else if (e.key === "Escape") {
      clearSearchState("start", setStartSuggestions);
      setStartHighlightIndex(-1);
    }
  };

  const handleDestKeyDown = (e) => {
    const list = destSuggestions.length
      ? destSuggestions
      : destFocused && !destination.trim()
        ? recentSearches.map((s) => ({ displayName: s, placeId: s }))
        : [];

    if (!list.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setDestHighlightIndex((prev) => (prev < list.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setDestHighlightIndex((prev) => (prev > 0 ? prev - 1 : list.length - 1));
    } else if (e.key === "Enter" && destHighlightIndex >= 0 && list[destHighlightIndex]) {
      e.preventDefault();
      const selected = list[destHighlightIndex];
      setDestination(selected.displayName);
      if (addRecentSearch) addRecentSearch(selected.displayName);
      clearSearchState("destination", setDestSuggestions);
      setDestHighlightIndex(-1);
    } else if (e.key === "Escape") {
      clearSearchState("destination", setDestSuggestions);
      setDestHighlightIndex(-1);
    }
  };

  const handleWaypointSearch = (index, value) => {
    updateWaypoint(index, value);
    handleSearch(
      value,
      (list) => {
        setWaypointSuggestionsMap((prev) => ({ ...prev, [index]: list }));
      },
      `waypoint-${index}`
    );
  };

  return (
    <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-md">
      <div className="space-y-3">
        {/* Start Location Input */}
        <div className="relative">
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="start-location-input" className="block text-sm font-medium text-slate-300">
              🟢 From (Start Location)
            </label>
            {locationStatus !== "idle" && (
              <span
                className={`text-xs ${
                  locationStatus === "found"
                    ? "text-emerald-400"
                    : locationStatus === "locating"
                      ? "text-cyan-400"
                      : "text-amber-400"
                }`}
              >
                {locationStatus === "locating"
                  ? "Locating..."
                  : locationStatus === "found"
                    ? "GPS Located"
                    : "GPS permission denied"}
              </span>
            )}
          </div>

          <div className="relative flex items-center">
            <input
              id="start-location-input"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={startSuggestions.length > 0 || (startFocused && !start.trim() && recentSearches.length > 0)}
              aria-controls="start-suggestions-list"
              placeholder="Enter starting city or use GPS"
              value={start}
              onFocus={() => setStartFocused(true)}
              onBlur={() => setTimeout(() => setStartFocused(false), 200)}
              onChange={(event) => {
                const value = event.target.value;
                setStart(value);
                setStartHighlightIndex(-1);
                handleSearch(value, setStartSuggestions, "start");
              }}
              onKeyDown={handleStartKeyDown}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3 pl-4 pr-20 text-slate-100 outline-none transition focus:border-cyan-400"
            />

            <div className="absolute right-2 flex items-center gap-1">
              {start && (
                <button
                  type="button"
                  aria-label="Clear start location"
                  title="Clear"
                  onClick={() => {
                    setStart("");
                    clearSearchState("start", setStartSuggestions);
                  }}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                >
                  ✕
                </button>
              )}

              <button
                type="button"
                aria-label="Use current GPS location"
                title="Use my current location"
                onClick={() => detectCurrentLocation(false)}
                disabled={locationStatus === "locating"}
                className={`rounded-xl p-2 transition ${
                  locationStatus === "locating"
                    ? "bg-cyan-500/20 text-cyan-300"
                    : locationStatus === "found"
                      ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-cyan-200"
                }`}
              >
                📍
              </button>
            </div>
          </div>

          {/* Start suggestions */}
          {startSuggestions.length > 0 && (
            <ul
              id="start-suggestions-list"
              role="listbox"
              className="absolute z-30 mt-2 max-h-56 w-full overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-xl"
            >
              {startSuggestions.map((item, index) => (
                <li
                  key={item.placeId}
                  role="option"
                  aria-selected={startHighlightIndex === index}
                  className={`cursor-pointer border-b border-slate-800 px-4 py-3 text-sm transition ${
                    startHighlightIndex === index
                      ? "bg-cyan-950/80 text-cyan-200"
                      : "text-slate-200 hover:bg-slate-800"
                  }`}
                  onMouseDown={() => {
                    setStart(item.displayName);
                    if (addRecentSearch) addRecentSearch(item.displayName);
                    clearSearchState("start", setStartSuggestions);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">📍</span>
                    <span className="truncate">{item.displayName}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Dynamic Waypoint Stops */}
        {waypoints.map((stop, index) => (
          <div key={index} className="relative rounded-2xl border border-slate-800 bg-slate-950/60 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                  {index + 1}
                </span>
                Stop {index + 1}
              </span>
              <div className="flex items-center gap-1">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => moveWaypointUp(index)}
                    title="Move stop up"
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                  >
                    ⬆️
                  </button>
                )}
                {index < waypoints.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveWaypointDown(index)}
                    title="Move stop down"
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                  >
                    ⬇️
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeWaypoint(index)}
                  title="Remove stop"
                  className="rounded-lg p-1 text-rose-400 hover:bg-rose-500/10"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder={`Enter stop ${index + 1} city or landmark`}
                value={stop}
                onFocus={() => setWaypointFocusIndex(index)}
                onBlur={() => setTimeout(() => setWaypointFocusIndex(null), 200)}
                onChange={(e) => handleWaypointSearch(index, e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 pl-3 pr-10 text-sm text-slate-100 outline-none focus:border-cyan-400"
              />
            </div>

            {/* Waypoint suggestions dropdown */}
            {waypointFocusIndex === index && (waypointSuggestionsMap[index] || []).length > 0 && (
              <ul className="absolute z-30 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
                {(waypointSuggestionsMap[index] || []).map((item) => (
                  <li
                    key={item.placeId}
                    className="cursor-pointer border-b border-slate-800 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800"
                    onMouseDown={() => {
                      updateWaypoint(index, item.displayName);
                      setWaypointSuggestionsMap((prev) => ({ ...prev, [index]: [] }));
                    }}
                  >
                    📍 {item.displayName}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {/* Add Stop & Optimize Stop Order Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {waypoints.length < 5 && (
            <button
              type="button"
              aria-label="Add intermediate stop"
              onClick={addWaypoint}
              className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-cyan-300 transition hover:border-cyan-400 hover:bg-cyan-500/10 min-h-[44px]"
            >
              <span>➕</span>
              <span>Add Stop</span>
            </button>
          )}

          {waypoints.length > 1 && (
            <button
              type="button"
              aria-label="Toggle shortest stop sequence optimization"
              onClick={() => setOptimize(!optimize)}
              className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition min-h-[44px] ${
                optimize
                  ? "border-emerald-400 bg-emerald-400/20 text-emerald-300"
                  : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500"
              }`}
            >
              <span>⚡</span>
              <span>{optimize ? "Stop Order: Optimized (Shortest)" : "Optimize Stop Order"}</span>
            </button>
          )}
        </div>

        {/* Destination Location Input */}
        <div className="relative pt-1">
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="destination-location-input" className="block text-sm font-medium text-slate-300">
              🏁 To (Destination)
            </label>
          </div>

          <div className="relative flex items-center">
            <input
              id="destination-location-input"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={destSuggestions.length > 0 || (destFocused && !destination.trim() && recentSearches.length > 0)}
              aria-controls="dest-suggestions-list"
              placeholder="Enter your destination"
              value={destination}
              onFocus={() => setDestFocused(true)}
              onBlur={() => setTimeout(() => setDestFocused(false), 200)}
              onChange={(event) => {
                const value = event.target.value;
                setDestination(value);
                setDestHighlightIndex(-1);
                handleSearch(value, setDestSuggestions, "destination");
              }}
              onKeyDown={handleDestKeyDown}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3 pl-4 pr-12 text-slate-100 outline-none transition focus:border-cyan-400 min-h-[48px]"
            />

            {destination && (
              <button
                type="button"
                aria-label="Clear destination"
                title="Clear"
                onClick={() => {
                  setDestination("");
                  clearSearchState("destination", setDestSuggestions);
                }}
                className="absolute right-2 flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Destination suggestions dropdown */}
          {destSuggestions.length > 0 && (
            <ul
              id="dest-suggestions-list"
              role="listbox"
              className="absolute z-30 mt-2 max-h-56 w-full overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-xl"
            >
              {destSuggestions.map((item, index) => (
                <li
                  key={item.placeId}
                  role="option"
                  aria-selected={destHighlightIndex === index}
                  className={`cursor-pointer border-b border-slate-800 px-4 py-3 text-sm transition ${
                    destHighlightIndex === index
                      ? "bg-cyan-950/80 text-cyan-200"
                      : "text-slate-200 hover:bg-slate-800"
                  }`}
                  onMouseDown={() => {
                    setDestination(item.displayName);
                    if (addRecentSearch) addRecentSearch(item.displayName);
                    clearSearchState("destination", setDestSuggestions);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">📍</span>
                    <span className="truncate">{item.displayName}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Routing Avoidance Preferences & Plan Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-label="Toggle toll road avoidance"
              onClick={() => setAvoidTolls(!avoidTolls)}
              className={`rounded-full border px-4 py-2 text-xs font-medium transition min-h-[42px] flex items-center justify-center ${
                avoidTolls
                  ? "border-amber-400/50 bg-amber-400/15 text-amber-200"
                  : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
              }`}
            >
              🚫 Avoid Tolls
            </button>

            <button
              type="button"
              aria-label="Toggle highway avoidance"
              onClick={() => setAvoidHighways(!avoidHighways)}
              className={`rounded-full border px-4 py-2 text-xs font-medium transition min-h-[42px] flex items-center justify-center ${
                avoidHighways
                  ? "border-amber-400/50 bg-amber-400/15 text-amber-200"
                  : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
              }`}
            >
              🛣️ Avoid Highways
            </button>
          </div>

          <button
            type="button"
            aria-label="Plan and calculate trip route"
            onClick={planTrip}
            disabled={loading || !isOnline}
            className="w-full sm:w-auto rounded-2xl bg-cyan-400 px-7 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-cyan-800 disabled:text-slate-400 shadow-lg shadow-cyan-500/20 min-h-[48px] flex items-center justify-center"
          >
            {loading ? "Planning..." : isOnline ? "Plan Trip" : "Offline"}
          </button>
        </div>
      </div>

      {locationMessage && locationStatus !== "idle" && (
        <div
          className={`rounded-2xl border px-4 py-2.5 text-xs ${
            locationStatus === "found"
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
              : locationStatus === "locating"
                ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                : "border-amber-400/30 bg-amber-400/10 text-amber-200"
          }`}
        >
          {locationMessage}
        </div>
      )}

      {/* Categories Filters */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80">
        {PLACE_FILTERS.map((filter) => {
          const active = selectedFilters.includes(filter.id);

          return (
            <button
              key={filter.id}
              type="button"
              aria-label={`Filter by ${filter.label}`}
              onClick={() => toggleFilter(filter.id)}
              className={`rounded-full border px-4 py-2 text-xs font-medium transition min-h-[42px] flex items-center justify-center ${
                active
                  ? "border-cyan-300 bg-cyan-400/15 text-cyan-100"
                  : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* Offline Action Bar */}
      <div className="flex flex-wrap gap-2.5 pt-2">
        <button
          type="button"
          aria-label="Import offline trip JSON pack"
          onClick={onImportClick}
          className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-medium text-slate-200 transition hover:border-cyan-300 hover:text-cyan-100 min-h-[44px] flex items-center justify-center"
        >
          Import Offline Pack
        </button>
        {currentOfflinePack && (
          <>
            <button
              type="button"
              aria-label="Save current planned trip to local device storage"
              onClick={onSaveOffline}
              className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-medium text-slate-200 transition hover:border-cyan-300 hover:text-cyan-100 min-h-[44px] flex items-center justify-center"
            >
              Save Current Trip Offline
            </button>
            <button
              type="button"
              aria-label="Download offline trip pack as JSON file"
              onClick={onDownloadPack}
              className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-medium text-slate-200 transition hover:border-cyan-300 hover:text-cyan-100 min-h-[44px] flex items-center justify-center"
            >
              Download Trip Pack
            </button>
          </>
        )}
      </div>

      {errorMessage && (
        <p role="alert" aria-live="assertive" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
          ⚠️ {errorMessage}
        </p>
      )}
    </section>
  );
}
