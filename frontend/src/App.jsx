import { useEffect, useMemo, useRef, useState } from "react";

import TopBar from "./components/common/TopBar";
import SideNav from "./components/common/SideNav";
import AuthModal from "./components/common/AuthModal";
import HeroHeader from "./components/common/HeroHeader";
import MapView from "./components/map/MapView";
import RoutePlannerForm from "./components/route/RoutePlannerForm";
import TripSummaryPanel from "./components/route/TripSummaryPanel";
import LiveNavigationPanel from "./components/route/LiveNavigationPanel";
import MultiDayItineraryPanel from "./components/itinerary/MultiDayItineraryPanel";
import EmergencyPanel from "./components/emergency/EmergencyPanel";
import EmergencyHubModal from "./components/emergency/EmergencyHubModal";
import HotelSearchModal from "./components/hotels/HotelSearchModal";
import TripHistoryPanel from "./components/history/TripHistoryPanel";
import OfflineChecklist from "./components/offline/OfflineChecklist";
import OfflineTripLibrary from "./components/offline/OfflineTripLibrary";
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

// ─── Main Dashboard ────────────────────────────────────────────────────────────

function SmartTravelDashboard() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isHotelsOpen, setIsHotelsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [activeView, setActiveView] = useState("plan"); // 'plan' | 'trips' | 'offline'

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
    if (!planner.route) return [];
    const services = normalizeEmergencyServices(planner.route.emergencyServices);
    return EMERGENCY_SERVICE_CONFIG.map((service) => ({
      ...service,
      count: (services[service.id] || []).length,
      nearestPlace: getNearestPlace(services[service.id] || [], emergencyReferencePoint),
    }));
  }, [emergencyReferencePoint, planner.route]);

  const emergencyFallbackCount = useMemo(
    () => emergencyFallbacks.filter((s) => s.nearestPlace).length,
    [emergencyFallbacks]
  );

  const nearestEmergencyOption = useMemo(() => {
    const available = emergencyFallbacks.filter((s) => s.nearestPlace);
    if (!available.length) return null;
    return [...available].sort((a, b) => {
      const ld = a.nearestPlace.distanceFromReference;
      const rd = b.nearestPlace.distanceFromReference;
      if (ld == null) return 1;
      if (rd == null) return -1;
      return ld - rd;
    })[0];
  }, [emergencyFallbacks]);

  const offline = useOfflineStorage(
    planner.route, planner.start, planner.destination, emergencyFallbackCount, isOnline
  );

  useEffect(() => {
    const up = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);

  // Show auth modal on first load if not logged in
  useEffect(() => {
    if (!auth.session) setIsAuthOpen(true);
    else setIsAuthOpen(false);
  }, [auth.session]);

  const handlePlanTripClick = () => planner.planTrip(() => navigation.stopTrip("idle", ""));
  const handleApplyHistoryTrip = (trip) => planner.applyHistoryTrip(trip, () => navigation.stopTrip("idle", ""));
  const handleOpenOfflineTrip = (trip) => planner.openOfflineTrip(trip, () => navigation.stopTrip("idle", ""));
  const handleLogout = () => {
    auth.handleLogout(() => {
      planner.setRoute(null);
      planner.setHistory([]);
      planner.setErrorMessage("");
      navigation.stopTrip("idle", "");
    });
    setIsAuthOpen(true);
  };

  const onFileInputChange = (e) => {
    const [file] = e.target.files || [];
    if (!file) return;
    offline.handleImportFile(file, (t) => handleOpenOfflineTrip(t), (err) => planner.setErrorMessage(err));
    e.target.value = "";
  };

  const stopFiltersLabel = formatFilterList(planner.route?.filters || planner.selectedFilters);

  // Left panel content
  const renderLeftPanel = () => {
    if (activeView === "trips") {
      return (
        <TripHistoryPanel
          history={planner.history}
          historyLoading={planner.historyLoading}
          isOnline={isOnline}
          onRefresh={planner.loadTripHistory}
          onApplyTrip={handleApplyHistoryTrip}
          onToggleFavorite={planner.handleFavoriteToggle}
        />
      );
    }
    if (activeView === "offline") {
      return (
        <OfflineTripLibrary
          offlineTrips={offline.offlineTrips}
          offlineMapPacks={offline.offlineMapPacks}
          syncingTripId={offline.syncingTripId}
          isOnline={isOnline}
          onOpenTrip={handleOpenOfflineTrip}
          onExportTrip={offline.downloadCurrentTripPack}
          onExportAllTrips={offline.handleExportAllTrips}
          onDeleteTrip={offline.deleteOfflineTrip}
          onRemoveMapPack={(id) => offline.handleRemoveOfflineMapArea(id, planner.setErrorMessage)}
          onSyncTripToCloud={(trip) => offline.syncTripToCloud(trip, auth.session, () => planner.loadTripHistory(), (msg) => planner.setErrorMessage(msg))}
        />
      );
    }
    // Default: plan
    return (
      <div className="space-y-5">
        <HeroHeader
          locationStatus={planner.locationStatus}
          locationMessage={planner.locationMessage}
          detectCurrentLocation={planner.detectCurrentLocation}
          start={planner.start}
          session={auth.session}
          onChipSelect={(prompt) => {
            setIsAIOpen(true);
            // The AI panel handles the chip prompt — we just open it
          }}
        />
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
          onImportClick={() => fileInputRef.current?.click()}
          onSaveOffline={offline.saveCurrentTripToDevice}
          onDownloadPack={offline.downloadCurrentTripPack}
          locationStatus={planner.locationStatus}
          locationMessage={planner.locationMessage}
          recentSearches={planner.recentSearches}
          clearRecentSearches={planner.clearRecentSearches}
          detectCurrentLocation={planner.detectCurrentLocation}
          addRecentSearch={planner.addRecentSearch}
        />

        {/* Offline banner */}
        {!isOnline && (
          <div className="rounded-xl border border-warn-500/30 bg-warn-500/10 px-4 py-3 text-xs text-warn-400">
            Offline mode active. Open saved routes or import a trip pack.
          </div>
        )}

        {/* Route details (when a trip is planned) */}
        {planner.route && (
          <div className="space-y-4 border-t border-zinc-800/60 pt-4">
            <TripSummaryPanel
              route={planner.route}
              start={planner.start}
              destination={planner.destination}
            />
            <LiveNavigationPanel
              navigationState={navigation.navigationState}
              activeStepIndex={navigation.activeStepIndex}
              steps={navigation.steps}
              isSimulating={navigation.isSimulating}
              simulationSpeedMultiplier={navigation.simulationSpeedMultiplier}
              progressPercent={navigation.progressPercent}
              distanceToNextManeuver={navigation.distanceToNextManeuver}
              liveDistanceToDestination={navigation.liveDistanceToDestination}
              deviationInfo={navigation.deviationInfo}
              dynamicEta={navigation.dynamicEta}
              setSimulationSpeedMultiplier={navigation.setSimulationSpeedMultiplier}
              startTrip={() => navigation.startTrip(planner.setErrorMessage)}
              stopTrip={navigation.stopTrip}
              startSimulation={navigation.startSimulation}
              pauseSimulation={navigation.pauseSimulation}
              resetSimulation={navigation.resetSimulation}
              onRecalculateRoute={planner.recalculateOptimizedRoute}
            />
            <MultiDayItineraryPanel
              route={planner.route}
              isOnline={isOnline}
              session={auth.session}
              onItineraryUpdated={planner.loadTripHistory}
              onRecalculateRoute={planner.recalculateOptimizedRoute}
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
              onDownloadMapArea={() => offline.handleDownloadOfflineMapArea(planner.setErrorMessage)}
              isOnline={isOnline}
            />
            <RecommendedStops route={planner.route} stopFiltersLabel={stopFiltersLabel} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#09090b] text-zinc-100">
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={onFileInputChange} />

      {/* ── Sidebar Navigation ── */}
      <SideNav
        session={auth.session}
        activeView={activeView}
        setActiveView={setActiveView}
        onEmergency={() => setIsEmergencyOpen(true)}
        onHotels={() => setIsHotelsOpen(true)}
        onAIToggle={() => setIsAIOpen((v) => !v)}
        isAIOpen={isAIOpen}
      />

      {/* ── Main Content ── */}
      <div className="flex flex-1 min-w-0 flex-col">
        {/* Top Bar */}
        <TopBar
          session={auth.session}
          isOnline={isOnline}
          locationStatus={planner.locationStatus}
          onAuthClick={() => setIsAuthOpen(true)}
        />

        {/* Content area: left panel + map + AI panel */}
        <div className="relative flex flex-1 min-h-0">

          {/* ── Left Panel (planner / trips / offline) ── */}
          <div className="relative z-10 hidden w-[380px] shrink-0 flex-col border-r border-zinc-800/70 bg-[#09090b] lg:flex overflow-hidden">
            {/* Panel header */}
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-800/60 px-4 py-3">
              <div className="flex items-center gap-2">
                {["plan", "trips", "offline"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setActiveView(v)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${activeView === v ? "bg-zinc-800 text-zinc-100" : "text-zinc-600 hover:text-zinc-400"}`}
                  >
                    {v === "plan" ? "Plan" : v === "trips" ? "My Trips" : "Offline"}
                  </button>
                ))}
              </div>
            </div>
            {/* Panel content */}
            <div className="flex-1 overflow-y-auto p-4">
              {renderLeftPanel()}
            </div>
            {/* Footer branding */}
            <div className="shrink-0 border-t border-zinc-800/60 px-4 py-2.5 text-[10px] text-zinc-800">
              Designed &amp; engineered by <span className="text-zinc-700 font-medium">IRFAN ANSARI</span>
            </div>
          </div>

          {/* ── Map (fills remaining space) ── */}
          <div className="relative flex-1 min-w-0">
            <MapView
              route={planner.route}
              isOffline={!isOnline}
              hasOfflineMap={offline.currentOfflineMapVerification.isVerified}
              currentLocation={navigation.navigationState.currentLocation}
              isNavigating={navigation.navigationState.isActive}
              focusedPlace={planner.focusedSafetyPlace}
            />
          </div>

          {/* ── AI Copilot Panel (right side, slides in) ── */}
          {isAIOpen && (
            <div className="relative z-10 hidden w-[360px] shrink-0 flex-col border-l border-zinc-800/70 bg-[#09090b] lg:flex animate-slide-in-right">
              <AITravelAssistant
                route={planner.route}
                embedded
                onClose={() => setIsAIOpen(false)}
              />
            </div>
          )}
        </div>

        {/* ── Mobile Bottom Sheet ── */}
        <div className="lg:hidden fixed inset-x-0 bottom-14 z-40">
          {/* Mobile: simplified bottom sheet — planner form in a scrollable drawer */}
          <div className="mx-3 mb-2 max-h-[55vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950/95 shadow-2xl backdrop-blur-lg">
            <div className="p-4">
              {renderLeftPanel()}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <AuthModal
        isOpen={isAuthOpen}
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
        session={auth.session}
      />

      <EmergencyHubModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
        currentLocation={navigation.navigationState.currentLocation}
        route={planner.route}
        session={auth.session}
      />

      <HotelSearchModal
        isOpen={isHotelsOpen}
        onClose={() => setIsHotelsOpen(false)}
        currentLocation={navigation.navigationState.currentLocation}
        route={planner.route}
      />

      {/* Mobile: AI floating sheet */}
      {isAIOpen && (
        <div className="lg:hidden fixed inset-x-0 bottom-14 top-14 z-50 animate-slide-in-bottom">
          <AITravelAssistant
            route={planner.route}
            embedded
            onClose={() => setIsAIOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <SmartTravelDashboard />
    </AuthProvider>
  );
}
