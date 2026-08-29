import { useEffect, useMemo, useRef, useState } from "react";

import AuthBar from "./components/common/AuthBar";
import HeroHeader from "./components/common/HeroHeader";
import EmergencyPanel from "./components/emergency/EmergencyPanel";
import TripHistoryPanel from "./components/history/TripHistoryPanel";
import MapView from "./components/map/MapView";
import OfflineChecklist from "./components/offline/OfflineChecklist";
import OfflineTripLibrary from "./components/offline/OfflineTripLibrary";
import LiveNavigationPanel from "./components/route/LiveNavigationPanel";
import RoutePlannerForm from "./components/route/RoutePlannerForm";
import TripSummaryPanel from "./components/route/TripSummaryPanel";
import RecommendedStops from "./components/stops/RecommendedStops";
import AITravelAssistant from "./components/ai/AITravelAssistant";

import { AuthProvider } from "./context/AuthProvider";
import { useAuthContext } from "./context/useAuthContext";
import { useLiveNavigation } from "./hooks/useLiveNavigation";
import { useOfflineStorage } from "./hooks/useOfflineStorage";
import { useTripPlanner } from "./hooks/useTripPlanner";

import {
  EMERGENCY_SERVICE_CONFIG,
  formatFilterList,
  getNearestPlace,
  normalizeEmergencyServices,
} from "./utils/formatters";

function SmartTravelDashboard() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  const fileInputRef = useRef(null);

  const auth = useAuthContext();
  const planner = useTripPlanner(auth.session, isOnline);
  const navigation = useLiveNavigation(planner.route);

  const emergencyReferencePoint =
    navigation.navigationState.currentLocation || planner.route?.start || null;
  const emergencyReferenceLabel = navigation.navigationState.currentLocation
    ? "live position"
    : "trip start";

  const emergencyFallbacks = useMemo(() => {
    if (!planner.route) {
      return [];
    }

    const services = normalizeEmergencyServices(planner.route.emergencyServices);

    return EMERGENCY_SERVICE_CONFIG.map((service) => {
      const places = services[service.id] || [];

      return {
        ...service,
        count: places.length,
        nearestPlace: getNearestPlace(places, emergencyReferencePoint),
      };
    });
  }, [emergencyReferencePoint, planner.route]);

  const emergencyFallbackCount = useMemo(
    () => emergencyFallbacks.filter((service) => service.nearestPlace).length,
    [emergencyFallbacks]
  );

  const nearestEmergencyOption = useMemo(() => {
    const availableServices = emergencyFallbacks.filter((service) => service.nearestPlace);

    if (!availableServices.length) {
      return null;
    }

    return [...availableServices].sort((left, right) => {
      const leftDistance = left.nearestPlace.distanceFromReference;
      const rightDistance = right.nearestPlace.distanceFromReference;

      if (leftDistance === null || leftDistance === undefined) return 1;
      if (rightDistance === null || rightDistance === undefined) return -1;
      return leftDistance - rightDistance;
    })[0];
  }, [emergencyFallbacks]);

  const offline = useOfflineStorage(
    planner.route,
    planner.start,
    planner.destination,
    emergencyFallbackCount,
    isOnline
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handlePlanTripClick = () => {
    planner.planTrip(() => {
      navigation.stopTrip("idle", "");
    });
  };

  const handleApplyHistoryTrip = (trip) => {
    planner.applyHistoryTrip(trip, () => {
      navigation.stopTrip("idle", "");
    });
  };

  const handleOpenOfflineTrip = (trip) => {
    planner.openOfflineTrip(trip, () => {
      navigation.stopTrip("idle", "");
    });
  };

  const handleLogout = () => {
    auth.handleLogout(() => {
      planner.setRoute(null);
      planner.setHistory([]);
      planner.setErrorMessage("");
      navigation.stopTrip("idle", "");
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const onFileInputChange = (event) => {
    const [file] = event.target.files || [];
    if (!file) return;

    offline.handleImportFile(
      file,
      (importedTrip) => handleOpenOfflineTrip(importedTrip),
      (err) => planner.setErrorMessage(err)
    );
    event.target.value = "";
  };

  const stopFiltersLabel = formatFilterList(
    planner.route?.filters || planner.selectedFilters
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={onFileInputChange}
      />

      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
        <AuthBar
          session={auth.session}
          authMode={auth.authMode}
          setAuthMode={auth.setAuthMode}
          authEmail={auth.authEmail}
          setAuthEmail={auth.setAuthEmail}
          authPassword={auth.authPassword}
          setAuthPassword={auth.setAuthPassword}
          authLoading={auth.authLoading}
          authError={auth.authError}
          setAuthError={auth.setAuthError}
          handleAuthentication={auth.handleAuthentication}
          handleLogout={handleLogout}
        />

        {!isOnline && (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            Offline mode is active. You can open saved routes, import offline trip
            packs, and use the route preview without network access.
          </div>
        )}

        <section className="rounded-3xl border border-cyan-500/20 bg-linear-to-br from-slate-900 via-slate-900 to-cyan-950/60 p-6 shadow-2xl shadow-cyan-950/30">
          <div className="flex flex-col gap-6">
            <HeroHeader />

            <RoutePlannerForm
              start={planner.start}
              setStart={planner.setStart}
              destination={planner.destination}
              setDestination={planner.setDestination}
              waypoints={planner.waypoints}
              addWaypoint={planner.addWaypoint}
              removeWaypoint={planner.removeWaypoint}
              updateWaypoint={planner.updateWaypoint}
              moveWaypointUp={planner.moveWaypointUp}
              moveWaypointDown={planner.moveWaypointDown}
              avoidTolls={planner.avoidTolls}
              setAvoidTolls={planner.setAvoidTolls}
              avoidHighways={planner.avoidHighways}
              setAvoidHighways={planner.setAvoidHighways}
              optimize={planner.optimize}
              setOptimize={planner.setOptimize}
              startSuggestions={planner.startSuggestions}
              destSuggestions={planner.destSuggestions}
              selectedFilters={planner.selectedFilters}
              toggleFilter={planner.toggleFilter}
              handleSearch={planner.handleSearch}
              clearSearchState={planner.clearSearchState}
              setStartSuggestions={planner.setStartSuggestions}
              setDestSuggestions={planner.setDestSuggestions}
              planTrip={handlePlanTripClick}
              loading={planner.loading}
              isOnline={isOnline}
              errorMessage={planner.errorMessage}
              currentOfflinePack={offline.currentOfflinePack}
              onImportClick={handleImportClick}
              onSaveOffline={offline.saveCurrentTripToDevice}
              onDownloadPack={offline.downloadCurrentTripPack}
              locationStatus={planner.locationStatus}
              locationMessage={planner.locationMessage}
              recentSearches={planner.recentSearches}
              clearRecentSearches={planner.clearRecentSearches}
              detectCurrentLocation={planner.detectCurrentLocation}
              addRecentSearch={planner.addRecentSearch}
            />
          </div>
        </section>

        <section className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,420px)]">
          <div className="min-h-[480px] overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
            <MapView
              route={planner.route}
              isOffline={!isOnline}
              hasOfflineMap={offline.currentOfflineMapVerification.isVerified}
              currentLocation={navigation.navigationState.currentLocation}
              isNavigating={navigation.navigationState.isActive}
              focusedPlace={planner.focusedSafetyPlace}
            />
          </div>

          <div className="grid gap-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5">
              <div className="space-y-5">
                <TripSummaryPanel
                  route={planner.route}
                  start={planner.start}
                  destination={planner.destination}
                />

                {planner.route && (
                  <>
                    <LiveNavigationPanel
                      navigationState={navigation.navigationState}
                      activeStepIndex={navigation.activeStepIndex}
                      steps={navigation.steps}
                      isSimulating={navigation.isSimulating}
                      simulationSpeedMultiplier={navigation.simulationSpeedMultiplier}
                      progressPercent={navigation.progressPercent}
                      distanceToNextManeuver={navigation.distanceToNextManeuver}
                      liveDistanceToDestination={navigation.liveDistanceToDestination}
                      setSimulationSpeedMultiplier={navigation.setSimulationSpeedMultiplier}
                      startTrip={() => navigation.startTrip(planner.setErrorMessage)}
                      stopTrip={navigation.stopTrip}
                      startSimulation={navigation.startSimulation}
                      pauseSimulation={navigation.pauseSimulation}
                      resetSimulation={navigation.resetSimulation}
                    />

                    <EmergencyPanel
                      emergencyReferenceLabel={emergencyReferenceLabel}
                      emergencyFallbacks={emergencyFallbacks}
                      emergencyFallbackCount={emergencyFallbackCount}
                      nearestEmergencyOption={nearestEmergencyOption}
                      focusedSafetyPlace={planner.focusedSafetyPlace}
                      setFocusedSafetyPlace={planner.setFocusedSafetyPlace}
                    />

                    <OfflineChecklist
                      offlineReadinessItems={offline.offlineReadinessItems}
                      offlineReadyCount={offline.offlineReadyCount}
                      isTripLowSignalReady={offline.isTripLowSignalReady}
                      currentOfflinePack={offline.currentOfflinePack}
                      currentOfflineMapPreview={offline.currentOfflineMapPreview}
                      currentOfflineMapVerification={offline.currentOfflineMapVerification}
                      mapDownloadState={offline.mapDownloadState}
                      onDownloadMapArea={() =>
                        offline.handleDownloadOfflineMapArea(planner.setErrorMessage)
                      }
                      isOnline={isOnline}
                    />

                    <RecommendedStops
                      route={planner.route}
                      stopFiltersLabel={stopFiltersLabel}
                    />
                  </>
                )}
              </div>
            </div>

            <OfflineTripLibrary
              offlineTrips={offline.offlineTrips}
              offlineMapPacks={offline.offlineMapPacks}
              syncingTripId={offline.syncingTripId}
              isOnline={isOnline}
              onOpenTrip={handleOpenOfflineTrip}
              onExportTrip={offline.downloadCurrentTripPack}
              onExportAllTrips={offline.handleExportAllTrips}
              onDeleteTrip={offline.deleteOfflineTrip}
              onRemoveMapPack={(id) =>
                offline.handleRemoveOfflineMapArea(id, planner.setErrorMessage)
              }
              onSyncTripToCloud={(trip) =>
                offline.syncTripToCloud(
                  trip,
                  auth.session,
                  () => planner.loadTripHistory(),
                  (msg) => planner.setErrorMessage(msg)
                )
              }
            />

            <TripHistoryPanel
              history={planner.history}
              historyLoading={planner.historyLoading}
              isOnline={isOnline}
              onRefresh={planner.loadTripHistory}
              onApplyTrip={handleApplyHistoryTrip}
              onToggleFavorite={planner.handleFavoriteToggle}
            />
          </div>
        </section>
      </div>

      {/* Floating AI Travel Assistant */}
      <AITravelAssistant route={planner.route} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SmartTravelDashboard />
    </AuthProvider>
  );
}
