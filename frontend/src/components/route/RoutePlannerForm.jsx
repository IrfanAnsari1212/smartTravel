import { useState } from "react";
import { PLACE_FILTERS } from "../../utils/formatters";

export default function RoutePlannerForm({
  start,
  setStart,
  destination,
  setDestination,
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
  clearRecentSearches,
  detectCurrentLocation,
  addRecentSearch,
}) {
  const [startFocused, setStartFocused] = useState(false);
  const [destFocused, setDestFocused] = useState(false);
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

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4 md:grid-cols-[1fr_1fr_auto]">
        {/* Start / From input */}
        <div className="relative">
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="start-location-input" className="block text-sm text-slate-300">
              From (Start Location)
            </label>
            {locationStatus === "locating" && (
              <span className="text-xs text-cyan-300 animate-pulse">Detecting GPS...</span>
            )}
            {locationStatus === "found" && (
              <span className="text-xs text-emerald-300">Current location active</span>
            )}
            {locationStatus === "denied" && (
              <span className="text-xs text-amber-300">GPS permission denied</span>
            )}
          </div>

          <div className="relative flex items-center">
            <input
              id="start-location-input"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={startSuggestions.length > 0 || (startFocused && !start.trim() && recentSearches.length > 0)}
              aria-controls="start-suggestions-list"
              placeholder="Enter a starting city or use GPS"
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
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 py-3 pl-4 pr-20 text-slate-100 outline-none transition focus:border-cyan-400"
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
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
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
                {locationStatus === "locating" ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Start suggestions & recent searches dropdown */}
          {startSuggestions.length > 0 && (
            <ul
              id="start-suggestions-list"
              role="listbox"
              className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-xl"
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

          {startFocused && !start.trim() && recentSearches.length > 0 && startSuggestions.length === 0 && (
            <div className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-2 shadow-xl">
              <div className="flex items-center justify-between px-3 py-1 text-xs uppercase tracking-wider text-slate-400">
                <span>Recent Searches</span>
                {clearRecentSearches && (
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      clearRecentSearches();
                    }}
                    className="text-cyan-300 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              <ul role="listbox">
                {recentSearches.map((item, index) => (
                  <li
                    key={item}
                    role="option"
                    aria-selected={startHighlightIndex === index}
                    className={`cursor-pointer rounded-xl px-3 py-2 text-sm transition ${
                      startHighlightIndex === index
                        ? "bg-cyan-950/80 text-cyan-200"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                    onMouseDown={() => {
                      setStart(item);
                      clearSearchState("start", setStartSuggestions);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">🕒</span>
                      <span className="truncate">{item}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Destination / To input */}
        <div className="relative">
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="destination-location-input" className="block text-sm text-slate-300">
              To (Destination)
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
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 py-3 pl-4 pr-12 text-slate-100 outline-none transition focus:border-cyan-400"
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
                className="absolute right-2 rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Destination suggestions dropdown */}
          {destSuggestions.length > 0 && (
            <ul
              id="dest-suggestions-list"
              role="listbox"
              className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-xl"
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

          {destFocused && !destination.trim() && recentSearches.length > 0 && destSuggestions.length === 0 && (
            <div className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-2 shadow-xl">
              <div className="flex items-center justify-between px-3 py-1 text-xs uppercase tracking-wider text-slate-400">
                <span>Recent Searches</span>
                {clearRecentSearches && (
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      clearRecentSearches();
                    }}
                    className="text-cyan-300 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              <ul role="listbox">
                {recentSearches.map((item, index) => (
                  <li
                    key={item}
                    role="option"
                    aria-selected={destHighlightIndex === index}
                    className={`cursor-pointer rounded-xl px-3 py-2 text-sm transition ${
                      destHighlightIndex === index
                        ? "bg-cyan-950/80 text-cyan-200"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                    onMouseDown={() => {
                      setDestination(item);
                      clearSearchState("destination", setDestSuggestions);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">🕒</span>
                      <span className="truncate">{item}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Plan Trip Button */}
        <div className="flex items-end">
          <button
            type="button"
            onClick={planTrip}
            disabled={loading || !isOnline}
            className="w-full rounded-2xl bg-cyan-400 px-6 py-3 font-medium text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-cyan-800 disabled:text-slate-300 md:w-auto"
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

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onImportClick}
          className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300 hover:text-cyan-100"
        >
          Import Offline Pack
        </button>
        {currentOfflinePack && (
          <>
            <button
              type="button"
              onClick={onSaveOffline}
              className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300 hover:text-cyan-100"
            >
              Save Current Trip Offline
            </button>
            <button
              type="button"
              onClick={onDownloadPack}
              className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300 hover:text-cyan-100"
            >
              Download Trip Pack
            </button>
          </>
        )}
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
