export default function OfflineChecklist({
  offlineReadinessItems,
  offlineReadyCount,
  isTripLowSignalReady,
  currentOfflinePack,
  currentOfflineMapPreview,
  currentOfflineMapVerification,
  mapDownloadState,
  onDownloadMapArea,
  isOnline,
}) {
  const isCurrentMapDownloading =
    currentOfflinePack &&
    mapDownloadState.tripId === currentOfflinePack.id &&
    mapDownloadState.status === "downloading";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-200">Offline readiness</p>
          <p className="mt-2 text-sm text-slate-400">
            Use this checklist before heading into a low-signal area.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs ${
            isTripLowSignalReady
              ? "bg-emerald-400/15 text-emerald-100"
              : "bg-amber-400/15 text-amber-100"
          }`}
        >
          {offlineReadyCount}/{offlineReadinessItems.length} ready
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {offlineReadinessItems.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-200">{item.label}</p>
              <span
                className={`rounded-full px-3 py-1 text-xs ${
                  item.ready
                    ? "bg-emerald-400/15 text-emerald-100"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {item.ready ? "Ready" : "Pending"}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">{item.detail}</p>
          </div>
        ))}
      </div>

      {currentOfflinePack && currentOfflineMapPreview && (
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-200">
                Offline Map Area Cache
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {currentOfflineMapVerification.isVerified
                  ? "All required map tiles are verified in Cache Storage."
                  : `Download ~${currentOfflineMapPreview.tileCount} map tiles for offline panning and zoom.`}
              </p>
            </div>
            <button
              type="button"
              onClick={onDownloadMapArea}
              disabled={isCurrentMapDownloading || !isOnline}
              className="rounded-full border border-slate-700 px-4 py-2 text-xs text-slate-200 transition hover:border-cyan-300 hover:text-cyan-100 disabled:cursor-not-allowed disabled:text-slate-500"
            >
              {isCurrentMapDownloading
                ? `Downloading (${mapDownloadState.completed}/${mapDownloadState.total})...`
                : currentOfflineMapVerification.isVerified
                  ? "Re-download Tiles"
                  : "Download Map Area"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

