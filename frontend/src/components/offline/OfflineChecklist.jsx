import { CheckCircle, Clock, Download, Loader } from "lucide-react";

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
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-100">Offline Readiness</h3>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${
          isTripLowSignalReady
            ? "border-success-500/30 bg-success-500/10 text-success-400"
            : "border-warn-500/30 bg-warn-500/10 text-warn-400"
        }`}>
          {offlineReadyCount}/{offlineReadinessItems.length} ready
        </span>
      </div>

      <p className="text-xs text-zinc-600">Complete this checklist before entering low-signal areas.</p>

      {/* Checklist items */}
      <div className="space-y-2">
        {offlineReadinessItems.map((item) => (
          <div
            key={item.label}
            className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 transition ${
              item.ready
                ? "border-zinc-800 bg-zinc-900"
                : "border-zinc-800/50 bg-zinc-900/50"
            }`}
          >
            <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
              item.ready
                ? "border-success-500/40 bg-success-500/10"
                : "border-zinc-700 bg-zinc-800"
            }`}>
              {item.ready
                ? <CheckCircle className="h-3 w-3 text-success-400" />
                : <Clock className="h-3 w-3 text-zinc-600" />
              }
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-medium ${item.ready ? "text-zinc-200" : "text-zinc-500"}`}>
                {item.label}
              </p>
              <p className="mt-0.5 text-[10px] text-zinc-600">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Map tile download */}
      {currentOfflinePack && currentOfflineMapPreview && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-200">Offline Map Tiles</p>
              <p className="mt-0.5 text-[10px] text-zinc-600">
                {currentOfflineMapVerification.isVerified
                  ? "All map tiles verified in cache ✓"
                  : `~${currentOfflineMapPreview.tileCount} tiles needed for offline panning`}
              </p>
              {isCurrentMapDownloading && (
                <p className="mt-1 text-[10px] text-brand-400">
                  {mapDownloadState.completed}/{mapDownloadState.total} tiles cached…
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onDownloadMapArea}
              disabled={isCurrentMapDownloading || !isOnline}
              className={`flex h-8 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition ${
                currentOfflineMapVerification.isVerified
                  ? "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                  : "border-brand-800/40 bg-brand-950/30 text-brand-400 hover:bg-brand-950/50"
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {isCurrentMapDownloading
                ? <Loader className="h-3.5 w-3.5 animate-spin" />
                : <Download className="h-3.5 w-3.5" />}
              {isCurrentMapDownloading
                ? "Downloading…"
                : currentOfflineMapVerification.isVerified
                  ? "Re-download"
                  : "Download"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
