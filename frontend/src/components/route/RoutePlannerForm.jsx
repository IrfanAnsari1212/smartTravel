import { useState } from "react";
import { Search, MapPin, Flag, Plus, ArrowUp, ArrowDown, X, Loader, Zap, Navigation } from "lucide-react";
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
    if (e.key === "ArrowDown") { e.preventDefault(); setStartHighlightIndex((p) => (p < list.length - 1 ? p + 1 : 0)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setStartHighlightIndex((p) => (p > 0 ? p - 1 : list.length - 1)); }
    else if (e.key === "Enter" && startHighlightIndex >= 0 && list[startHighlightIndex]) {
      e.preventDefault();
      const selected = list[startHighlightIndex];
      setStart(selected.displayName);
      if (addRecentSearch) addRecentSearch(selected.displayName);
      clearSearchState("start", setStartSuggestions);
      setStartHighlightIndex(-1);
    } else if (e.key === "Escape") { clearSearchState("start", setStartSuggestions); setStartHighlightIndex(-1); }
  };

  const handleDestKeyDown = (e) => {
    const list = destSuggestions.length
      ? destSuggestions
      : destFocused && !destination.trim()
        ? recentSearches.map((s) => ({ displayName: s, placeId: s }))
        : [];
    if (!list.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setDestHighlightIndex((p) => (p < list.length - 1 ? p + 1 : 0)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setDestHighlightIndex((p) => (p > 0 ? p - 1 : list.length - 1)); }
    else if (e.key === "Enter" && destHighlightIndex >= 0 && list[destHighlightIndex]) {
      e.preventDefault();
      const selected = list[destHighlightIndex];
      setDestination(selected.displayName);
      if (addRecentSearch) addRecentSearch(selected.displayName);
      clearSearchState("destination", setDestSuggestions);
      setDestHighlightIndex(-1);
    } else if (e.key === "Escape") { clearSearchState("destination", setDestSuggestions); setDestHighlightIndex(-1); }
  };

  const handleWaypointSearch = (index, value) => {
    updateWaypoint(index, value);
    handleSearch(value, (list) => setWaypointSuggestionsMap((p) => ({ ...p, [index]: list })), `waypoint-${index}`);
  };

  // Combined list for start dropdown
  const startList = startSuggestions.length
    ? startSuggestions
    : startFocused && !start.trim() && recentSearches.length
      ? recentSearches.map((s) => ({ displayName: s, placeId: s, isRecent: true }))
      : [];

  const destList = destSuggestions.length
    ? destSuggestions
    : destFocused && !destination.trim() && recentSearches.length
      ? recentSearches.map((s) => ({ displayName: s, placeId: s, isRecent: true }))
      : [];

  return (
    <div className="space-y-4">
      {/* Route Inputs */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        {/* From */}
        <div className="relative">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success-500/20">
              <div className="h-2.5 w-2.5 rounded-full bg-success-400" />
            </div>
            <input
              id="start-location-input"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={startList.length > 0}
              aria-controls="start-suggestions-list"
              placeholder="From — starting location"
              value={start}
              onFocus={() => setStartFocused(true)}
              onBlur={() => setTimeout(() => setStartFocused(false), 200)}
              onChange={(e) => { setStart(e.target.value); setStartHighlightIndex(-1); handleSearch(e.target.value, setStartSuggestions, "start"); }}
              onKeyDown={handleStartKeyDown}
              className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 outline-none"
            />
            <div className="flex items-center gap-1">
              {start && (
                <button type="button" aria-label="Clear start" onClick={() => { setStart(""); clearSearchState("start", setStartSuggestions); }} className="rounded-lg p-1 text-zinc-600 hover:text-zinc-400">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                aria-label="Use GPS location"
                onClick={() => detectCurrentLocation(false)}
                disabled={locationStatus === "locating"}
                className={`rounded-lg p-1.5 transition ${locationStatus === "locating" ? "text-brand-400" : locationStatus === "found" ? "text-success-400" : "text-zinc-600 hover:text-zinc-300"}`}
              >
                {locationStatus === "locating"
                  ? <Loader className="h-4 w-4 animate-spin" />
                  : <Navigation className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Start suggestions */}
          {startList.length > 0 && (
            <ul id="start-suggestions-list" role="listbox" className="border-t border-zinc-800 bg-zinc-900 max-h-52 overflow-y-auto">
              {startList.map((item, idx) => (
                <li
                  key={item.placeId}
                  role="option"
                  aria-selected={startHighlightIndex === idx}
                  onMouseDown={() => { setStart(item.displayName); if (addRecentSearch) addRecentSearch(item.displayName); clearSearchState("start", setStartSuggestions); }}
                  className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition ${startHighlightIndex === idx ? "bg-brand-950/60 text-brand-300" : "text-zinc-300 hover:bg-zinc-800"}`}
                >
                  <MapPin className={`h-3.5 w-3.5 shrink-0 ${item.isRecent ? "text-zinc-600" : "text-brand-500"}`} />
                  <span className="truncate">{item.displayName}</span>
                  {item.isRecent && <span className="ml-auto text-[10px] text-zinc-700">Recent</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Divider with connector line */}
        <div className="flex items-center gap-3 px-4 py-0.5 border-t border-zinc-800/60">
          <div className="ml-3 flex w-1 justify-center">
            <div className="h-5 w-px bg-zinc-700" />
          </div>
          {waypoints.length < 5 && (
            <button
              type="button"
              aria-label="Add stop"
              onClick={addWaypoint}
              className="ml-auto flex items-center gap-1 rounded-full border border-zinc-700/60 px-2.5 py-1 text-[11px] font-medium text-zinc-500 transition hover:border-brand-500/40 hover:text-brand-400"
            >
              <Plus className="h-3 w-3" />
              Add stop
            </button>
          )}
        </div>

        {/* Waypoints */}
        {waypoints.map((stop, index) => (
          <div key={index} className="relative border-t border-zinc-800/60">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-400">
                {index + 1}
              </div>
              <input
                type="text"
                placeholder={`Stop ${index + 1}`}
                value={stop}
                onFocus={() => setWaypointFocusIndex(index)}
                onBlur={() => setTimeout(() => setWaypointFocusIndex(null), 200)}
                onChange={(e) => handleWaypointSearch(index, e.target.value)}
                className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 outline-none"
              />
              <div className="flex items-center gap-0.5">
                {index > 0 && (
                  <button type="button" onClick={() => moveWaypointUp(index)} aria-label="Move up" className="rounded-lg p-1 text-zinc-600 hover:text-zinc-400">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                )}
                {index < waypoints.length - 1 && (
                  <button type="button" onClick={() => moveWaypointDown(index)} aria-label="Move down" className="rounded-lg p-1 text-zinc-600 hover:text-zinc-400">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                )}
                <button type="button" onClick={() => removeWaypoint(index)} aria-label="Remove stop" className="rounded-lg p-1 text-zinc-600 hover:text-danger-400">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            {waypointFocusIndex === index && (waypointSuggestionsMap[index] || []).length > 0 && (
              <ul className="border-t border-zinc-800 bg-zinc-900 max-h-40 overflow-y-auto">
                {(waypointSuggestionsMap[index] || []).map((item) => (
                  <li key={item.placeId} onMouseDown={() => { updateWaypoint(index, item.displayName); setWaypointSuggestionsMap((p) => ({ ...p, [index]: [] })); }}
                    className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                    <span className="truncate">{item.displayName}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {/* Divider */}
        <div className="flex items-center gap-3 px-4 py-0.5 border-t border-zinc-800/60">
          <div className="ml-3 flex w-1 justify-center">
            <div className="h-4 w-px bg-zinc-700" />
          </div>
        </div>

        {/* To */}
        <div className="relative border-t border-zinc-800/60">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-danger-500/20">
              <Flag className="h-3.5 w-3.5 text-danger-400" />
            </div>
            <input
              id="destination-location-input"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={destList.length > 0}
              aria-controls="dest-suggestions-list"
              placeholder="To — destination"
              value={destination}
              onFocus={() => setDestFocused(true)}
              onBlur={() => setTimeout(() => setDestFocused(false), 200)}
              onChange={(e) => { setDestination(e.target.value); setDestHighlightIndex(-1); handleSearch(e.target.value, setDestSuggestions, "destination"); }}
              onKeyDown={handleDestKeyDown}
              className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 outline-none"
            />
            {destination && (
              <button type="button" aria-label="Clear destination" onClick={() => { setDestination(""); clearSearchState("destination", setDestSuggestions); }} className="rounded-lg p-1 text-zinc-600 hover:text-zinc-400">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Destination suggestions */}
          {destList.length > 0 && (
            <ul id="dest-suggestions-list" role="listbox" className="border-t border-zinc-800 bg-zinc-900 max-h-52 overflow-y-auto">
              {destList.map((item, idx) => (
                <li
                  key={item.placeId}
                  role="option"
                  aria-selected={destHighlightIndex === idx}
                  onMouseDown={() => { setDestination(item.displayName); if (addRecentSearch) addRecentSearch(item.displayName); clearSearchState("destination", setDestSuggestions); }}
                  className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition ${destHighlightIndex === idx ? "bg-brand-950/60 text-brand-300" : "text-zinc-300 hover:bg-zinc-800"}`}
                >
                  <MapPin className={`h-3.5 w-3.5 shrink-0 ${item.isRecent ? "text-zinc-600" : "text-brand-500"}`} />
                  <span className="truncate">{item.displayName}</span>
                  {item.isRecent && <span className="ml-auto text-[10px] text-zinc-700">Recent</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Route options + Plan button */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-label="Toggle toll avoidance"
          onClick={() => setAvoidTolls(!avoidTolls)}
          className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition ${avoidTolls ? "border-warn-500/40 bg-warn-500/10 text-warn-400" : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"}`}
        >
          🚫 No Tolls
        </button>
        <button
          type="button"
          aria-label="Toggle highway avoidance"
          onClick={() => setAvoidHighways(!avoidHighways)}
          className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition ${avoidHighways ? "border-warn-500/40 bg-warn-500/10 text-warn-400" : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"}`}
        >
          🛣️ No Highways
        </button>
        {waypoints.length > 1 && (
          <button
            type="button"
            aria-label="Optimize stop order"
            onClick={() => setOptimize(!optimize)}
            className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition ${optimize ? "border-success-500/40 bg-success-500/10 text-success-400" : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"}`}
          >
            <Zap className="h-3.5 w-3.5" />
            {optimize ? "Optimized" : "Optimize"}
          </button>
        )}

        <button
          type="button"
          aria-label="Plan trip route"
          onClick={planTrip}
          disabled={loading || !isOnline}
          className="ml-auto flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-lg shadow-brand-900/30 transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {loading ? "Planning…" : isOnline ? "Plan Trip" : "Offline"}
        </button>
      </div>

      {/* Location status message */}
      {locationMessage && locationStatus !== "idle" && (
        <div className={`rounded-xl border px-3 py-2 text-xs ${
          locationStatus === "found" ? "border-success-500/30 bg-success-500/10 text-success-400"
            : locationStatus === "locating" ? "border-brand-500/30 bg-brand-500/10 text-brand-400"
            : "border-warn-500/30 bg-warn-500/10 text-warn-400"
        }`}>
          {locationMessage}
        </div>
      )}

      {/* Category Filters */}
      <div>
        <p className="mb-2 text-[11px] font-medium tracking-wide text-zinc-600 uppercase">Discover along route</p>
        <div className="flex flex-wrap gap-1.5">
          {PLACE_FILTERS.map((filter) => {
            const active = selectedFilters.includes(filter.id);
            return (
              <button
                key={filter.id}
                type="button"
                aria-label={`Filter: ${filter.label}`}
                onClick={() => toggleFilter(filter.id)}
                className={`flex h-7 items-center rounded-lg border px-3 text-xs font-medium transition ${
                  active
                    ? "border-brand-500/40 bg-brand-950/40 text-brand-300"
                    : "border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Offline actions */}
      <div className="flex flex-wrap gap-2 border-t border-zinc-800/60 pt-3">
        <button type="button" onClick={onImportClick} className="flex h-8 items-center rounded-lg border border-zinc-800 px-3 text-xs text-zinc-500 transition hover:border-zinc-700 hover:text-zinc-300">
          Import Pack
        </button>
        {currentOfflinePack && (
          <>
            <button type="button" onClick={onSaveOffline} className="flex h-8 items-center rounded-lg border border-zinc-800 px-3 text-xs text-zinc-500 transition hover:border-zinc-700 hover:text-zinc-300">
              Save Offline
            </button>
            <button type="button" onClick={onDownloadPack} className="flex h-8 items-center rounded-lg border border-zinc-800 px-3 text-xs text-zinc-500 transition hover:border-zinc-700 hover:text-zinc-300">
              Download Pack
            </button>
          </>
        )}
      </div>

      {/* Error */}
      {errorMessage && (
        <div role="alert" aria-live="assertive" className="rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-xs text-danger-400">
          ⚠ {errorMessage}
        </div>
      )}
    </div>
  );
}
