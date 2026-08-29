import { useEffect, useMemo, useState } from "react";
import {
  downloadOfflineMapPack,
  getOfflineMapPackVerification,
  getOfflineMapPreview,
  listOfflineMapPacks,
  removeOfflineMapPack,
} from "../services/offlineMapService";
import {
  createOfflineTripPack,
  downloadOfflineTrip,
  exportAllTripsArchive,
  listOfflineTrips,
  parseOfflineTripFile,
  removeOfflineTrip,
  saveOfflineTrip,
  updateTripSyncStatus,
} from "../services/offlineTripService";
import { planTripRequest } from "../services/tripService";
import {
  createEmptyMapVerification,
  EMERGENCY_SERVICE_CONFIG,
} from "../utils/formatters";

export function useOfflineStorage(route, start, destination, emergencyFallbackCount, isOnline) {
  const [offlineTrips, setOfflineTrips] = useState(() => {
    const list = listOfflineTrips();
    return Array.isArray(list) ? list : [];
  });
  const [offlineMapPacks, setOfflineMapPacks] = useState(() => listOfflineMapPacks());
  const [mapDownloadState, setMapDownloadState] = useState({
    tripId: null,
    completed: 0,
    total: 0,
    status: "idle",
  });
  const [currentOfflineMapVerification, setCurrentOfflineMapVerification] = useState(
    createEmptyMapVerification
  );
  const [syncingTripId, setSyncingTripId] = useState(null);

  const syncOfflineTrips = () => {
    const list = listOfflineTrips();
    setOfflineTrips(Array.isArray(list) ? list : []);
  };

  const syncOfflineMapPacks = () => {
    setOfflineMapPacks(listOfflineMapPacks());
  };

  const currentOfflinePack = useMemo(() => {
    if (!route) {
      return null;
    }

    return createOfflineTripPack({
      route,
      startQuery: start,
      destinationQuery: destination,
    });
  }, [destination, route, start]);

  const currentOfflineMapPreview = useMemo(() => {
    if (!currentOfflinePack) {
      return null;
    }

    try {
      return getOfflineMapPreview(currentOfflinePack);
    } catch {
      return null;
    }
  }, [currentOfflinePack]);

  const currentTripSavedOffline = useMemo(
    () =>
      currentOfflinePack
        ? offlineTrips.some((trip) => trip.id === currentOfflinePack.id)
        : false,
    [currentOfflinePack, offlineTrips]
  );

  useEffect(() => {
    let isCancelled = false;

    const verifyCurrentOfflineMap = async () => {
      if (!currentOfflinePack) {
        if (!isCancelled) {
          setCurrentOfflineMapVerification(createEmptyMapVerification());
        }
        return;
      }

      const metadata =
        offlineMapPacks.find((pack) => pack.id === currentOfflinePack.id) || null;

      if (!metadata) {
        if (!isCancelled) {
          setCurrentOfflineMapVerification(createEmptyMapVerification());
        }
        return;
      }

      setCurrentOfflineMapVerification((current) => ({
        ...current,
        metadata,
        totalCount: metadata.urls?.length || 0,
        isChecking: true,
      }));

      try {
        const verification = await getOfflineMapPackVerification(metadata.id);

        if (!isCancelled) {
          setCurrentOfflineMapVerification({
            ...verification,
            isChecking: false,
          });
        }
      } catch (error) {
        console.error(error);

        if (!isCancelled) {
          setCurrentOfflineMapVerification({
            metadata,
            cachedCount: 0,
            totalCount: metadata.urls?.length || 0,
            isVerified: false,
            supportsCacheStorage: typeof window !== "undefined" && "caches" in window,
            isChecking: false,
          });
        }
      }
    };

    verifyCurrentOfflineMap();

    return () => {
      isCancelled = true;
    };
  }, [currentOfflinePack, offlineMapPacks]);

  const saveCurrentTripToDevice = () => {
    if (!currentOfflinePack) return;
    saveOfflineTrip(currentOfflinePack);
    syncOfflineTrips();
  };

  const downloadCurrentTripPack = () => {
    if (!currentOfflinePack) return;
    downloadOfflineTrip(currentOfflinePack);
  };

  const handleExportAllTrips = () => {
    exportAllTripsArchive();
  };

  const handleImportFile = async (file, onImportSuccess, onError) => {
    if (!file) return;

    try {
      const result = await parseOfflineTripFile(file);

      if (result.isBulk) {
        result.trips.forEach((t) => saveOfflineTrip(t));
        syncOfflineTrips();
        if (onImportSuccess) {
          onImportSuccess(result.trips[0], `Successfully imported ${result.count} trips from backup!`);
        }
      } else {
        saveOfflineTrip(result.trip);
        syncOfflineTrips();
        if (onImportSuccess) {
          onImportSuccess(result.trip, `Trip "${result.trip.title}" imported successfully!`);
        }
      }
    } catch (error) {
      console.error(error);
      if (onError) onError(error.message || "Unable to import this offline trip pack.");
    }
  };

  const deleteOfflineTrip = (tripId) => {
    removeOfflineTrip(tripId);
    syncOfflineTrips();
  };

  const syncTripToCloud = async (trip, session, onSuccess, onError) => {
    if (!isOnline) {
      if (onError) onError("Go online to sync trip to your cloud account.");
      return;
    }

    if (!session?.token) {
      if (onError) onError("Please sign in to sync trips to the cloud.");
      return;
    }

    setSyncingTripId(trip.id);

    try {
      const serverResult = await planTripRequest({
        start: trip.startQuery,
        destination: trip.destinationQuery,
        filters: trip.filters || [],
      });

      updateTripSyncStatus(trip.id, "synced", serverResult.tripId);
      syncOfflineTrips();
      if (onSuccess) onSuccess("Trip synced to cloud account successfully!");
    } catch (err) {
      console.error("Sync error:", err);
      if (onError) onError(err.response?.data?.message || err.message || "Failed to sync trip to cloud.");
    } finally {
      setSyncingTripId(null);
    }
  };

  const handleDownloadOfflineMapArea = async (onError) => {
    if (!currentOfflinePack) return;

    if (!isOnline) {
      if (onError) onError("Go online to download route map tiles for offline use.");
      return;
    }

    try {
      saveOfflineTrip(currentOfflinePack);
      syncOfflineTrips();

      setMapDownloadState({
        tripId: currentOfflinePack.id,
        completed: 0,
        total: currentOfflineMapPreview?.tileCount || 0,
        status: "downloading",
      });

      await downloadOfflineMapPack(currentOfflinePack, {
        presetId: "standard",
        onProgress: ({ completed, total }) => {
          setMapDownloadState({
            tripId: currentOfflinePack.id,
            completed,
            total,
            status: "downloading",
          });
        },
      });

      syncOfflineMapPacks();
      setMapDownloadState((current) => ({
        ...current,
        tripId: currentOfflinePack.id,
        status: "done",
      }));
    } catch (error) {
      console.error(error);
      if (onError) onError(error.message || "Unable to download offline map tiles for this route.");
      setMapDownloadState({
        tripId: currentOfflinePack.id,
        completed: 0,
        total: 0,
        status: "error",
      });
    }
  };

  const handleRemoveOfflineMapArea = async (tripId, onError) => {
    try {
      await removeOfflineMapPack(tripId);
      syncOfflineMapPacks();
    } catch (error) {
      console.error(error);
      if (onError) onError(error.message || "Unable to remove this offline map pack.");
    }
  };

  const offlineReadinessItems = useMemo(() => {
    if (!route) return [];

    return [
      {
        label: "Route pack saved on this device",
        ready: currentTripSavedOffline,
        detail: currentTripSavedOffline
          ? "Available in the offline trip library."
          : "Save Offline keeps the route and stops available without network access.",
      },
      {
        label: "Full map area cached",
        ready: currentOfflineMapVerification.isVerified,
        detail: currentOfflineMapVerification.metadata
          ? currentOfflineMapVerification.isChecking
            ? "Checking cached map tiles now."
            : currentOfflineMapVerification.isVerified
              ? `${currentOfflineMapVerification.cachedCount}/${currentOfflineMapVerification.totalCount} tiles verified.`
              : `${currentOfflineMapVerification.cachedCount}/${currentOfflineMapVerification.totalCount} tiles found. Re-download recommended.`
          : currentOfflineMapPreview
            ? `${currentOfflineMapPreview.tileCount} tiles needed for the current route.`
            : "Download an offline map area for turn-by-map confidence.",
      },
      {
        label: "Stops and route data travel offline",
        ready: Boolean(route.geometry?.coordinates?.length),
        detail: `${route.places?.length || 0} saved stops stay bundled with the route pack.`,
      },
      {
        label: "Emergency fallbacks saved",
        ready: emergencyFallbackCount === EMERGENCY_SERVICE_CONFIG.length,
        detail: `${emergencyFallbackCount}/${EMERGENCY_SERVICE_CONFIG.length} emergency categories have offline fallbacks.`,
      },
    ];
  }, [
    currentOfflineMapPreview,
    currentOfflineMapVerification,
    currentTripSavedOffline,
    emergencyFallbackCount,
    route,
  ]);

  const offlineReadyCount = offlineReadinessItems.filter((item) => item.ready).length;
  const isTripLowSignalReady =
    offlineReadinessItems.length > 0 &&
    offlineReadinessItems.every((item) => item.ready);

  return {
    offlineTrips,
    offlineMapPacks,
    mapDownloadState,
    currentOfflinePack,
    currentOfflineMapPreview,
    currentOfflineMapVerification,
    currentTripSavedOffline,
    syncingTripId,
    saveCurrentTripToDevice,
    downloadCurrentTripPack,
    handleExportAllTrips,
    handleImportFile,
    deleteOfflineTrip,
    syncTripToCloud,
    handleDownloadOfflineMapArea,
    handleRemoveOfflineMapArea,
    offlineReadinessItems,
    offlineReadyCount,
    isTripLowSignalReady,
  };
}
