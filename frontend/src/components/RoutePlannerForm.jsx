import { PLACE_FILTERS } from "../utils/formatters";

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
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4 md:grid-cols-[1fr_1fr_auto]">
        <div className="relative">
          <label className="mb-2 block text-sm text-slate-300">Start</label>
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
                    clearSearchState("start", setStartSuggestions);
                  }}
                >
                  {item.displayName}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <label className="mb-2 block text-sm text-slate-300">Destination</label>
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
                    clearSearchState("destination", setDestSuggestions);
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
            disabled={loading || !isOnline}
            className="w-full rounded-2xl bg-cyan-400 px-6 py-3 font-medium text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-cyan-800 disabled:text-slate-300 md:w-auto"
          >
            {loading ? "Planning..." : isOnline ? "Plan Trip" : "Offline"}
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
