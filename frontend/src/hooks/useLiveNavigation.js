import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { getDistanceBetweenPoints } from "../utils/formatters";

const calculateBearing = (start, end) => {
  if (!start || !end) return 0;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const lat1 = toRad(start.lat);
  const lat2 = toRad(end.lat);
  const dLon = toRad(end.lon - start.lon);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
};

export function useLiveNavigation(route) {
  const [navigationState, setNavigationState] = useState({
    isActive: false,
    status: "idle", // 'idle' | 'requesting' | 'tracking' | 'simulating' | 'paused' | 'error' | 'arrived'
    currentLocation: null,
    error: "",
  });

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [simulationIndex, setSimulationIndex] = useState(0);
  const [simulationSpeedMultiplier, setSimulationSpeedMultiplier] = useState(1);
  const [isSimulating, setIsSimulating] = useState(false);

  const locationWatchRef = useRef(null);
  const simulationTimerRef = useRef(null);

  const coordinates = useMemo(() => {
    const raw = route?.geometry?.coordinates || [];
    return raw.map(([lon, lat]) => ({ lat, lon }));
  }, [route]);

  const steps = useMemo(() => {
    return route?.steps || [];
  }, [route]);

  const [prevRouteKey, setPrevRouteKey] = useState(
    route?.tripId || route?.geometry?.coordinates?.[0]?.join(",") || null
  );

  const currentRouteKey =
    route?.tripId || route?.geometry?.coordinates?.[0]?.join(",") || null;

  if (currentRouteKey !== prevRouteKey) {
    setPrevRouteKey(currentRouteKey);
    setActiveStepIndex(0);
    setSimulationIndex(0);
  }

  const stopTrip = useCallback((status = "idle", error = "") => {
    if (locationWatchRef.current !== null && typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(locationWatchRef.current);
      locationWatchRef.current = null;
    }

    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }

    setIsSimulating(false);
    setNavigationState((current) => ({
      ...current,
      isActive: false,
      status,
      error,
    }));
  }, []);

  const startTrip = useCallback((onError) => {
    if (!route) {
      if (onError) onError("Plan a route before starting GPS navigation.");
      return;
    }

    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      if (onError) onError("Geolocation is not supported on this device.");
      return;
    }

    stopTrip("idle");

    setNavigationState({
      isActive: true,
      status: "requesting",
      currentLocation: null,
      error: "",
    });

    locationWatchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const userLoc = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed || 0,
          heading: position.coords.heading || 0,
          timestamp: position.timestamp,
        };

        setNavigationState({
          isActive: true,
          status: "tracking",
          error: "",
          currentLocation: userLoc,
        });

        // Advance active step if within 35m of current step waypoint
        if (steps.length > 0) {
          const currentStep = steps[activeStepIndex];
          if (currentStep?.location?.length === 2) {
            const stepPoint = { lon: currentStep.location[0], lat: currentStep.location[1] };
            const dist = getDistanceBetweenPoints(userLoc, stepPoint);
            if (dist !== null && dist < 35 && activeStepIndex < steps.length - 1) {
              setActiveStepIndex((idx) => idx + 1);
            }
          }
        }
      },
      (error) => {
        stopTrip("error", error.message || "Unable to access your location.");
        if (onError) onError(error.message || "Unable to access your location.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 10000,
      }
    );
  }, [activeStepIndex, route, steps, stopTrip]);

  // Simulation Controls
  const startSimulation = useCallback(() => {
    if (!coordinates.length) return;

    if (locationWatchRef.current !== null) {
      navigator.geolocation.clearWatch(locationWatchRef.current);
      locationWatchRef.current = null;
    }

    setIsSimulating(true);
    setNavigationState((prev) => ({
      ...prev,
      isActive: true,
      status: "simulating",
      error: "",
    }));
  }, [coordinates.length]);

  const pauseSimulation = useCallback(() => {
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
    setIsSimulating(false);
    setNavigationState((prev) => ({
      ...prev,
      status: "paused",
    }));
  }, []);

  const resetSimulation = useCallback(() => {
    pauseSimulation();
    setSimulationIndex(0);
    setActiveStepIndex(0);
    if (coordinates.length) {
      setNavigationState({
        isActive: false,
        status: "idle",
        error: "",
        currentLocation: {
          lat: coordinates[0].lat,
          lon: coordinates[0].lon,
          speed: 0,
          heading: 0,
          accuracy: 5,
        },
      });
    }
  }, [coordinates, pauseSimulation]);

  // Simulation tick effect
  useEffect(() => {
    if (!isSimulating || !coordinates.length) return;

    const intervalMs = Math.max(100, Math.floor(1000 / simulationSpeedMultiplier));

    simulationTimerRef.current = setInterval(() => {
      setSimulationIndex((prevIdx) => {
        const nextIdx = prevIdx + 1;
        if (nextIdx >= coordinates.length) {
          clearInterval(simulationTimerRef.current);
          setIsSimulating(false);
          setNavigationState((prev) => ({
            ...prev,
            status: "arrived",
            currentLocation: {
              ...coordinates[coordinates.length - 1],
              speed: 0,
              heading: 0,
              accuracy: 5,
            },
          }));
          return coordinates.length - 1;
        }

        const currentPt = coordinates[nextIdx];
        const prevPt = coordinates[Math.max(0, nextIdx - 1)];
        const heading = calculateBearing(prevPt, currentPt);
        const simulatedSpeedMs = 18 * simulationSpeedMultiplier; // ~65 km/h base

        setNavigationState((prev) => ({
          ...prev,
          isActive: true,
          status: "simulating",
          currentLocation: {
            lat: currentPt.lat,
            lon: currentPt.lon,
            speed: simulatedSpeedMs,
            heading,
            accuracy: 5,
          },
        }));

        // Advance turn step
        if (steps.length > 0) {
          const currentStep = steps[activeStepIndex];
          if (currentStep?.location?.length === 2) {
            const stepPoint = { lon: currentStep.location[0], lat: currentStep.location[1] };
            const dist = getDistanceBetweenPoints(currentPt, stepPoint);
            if (dist !== null && dist < 45 && activeStepIndex < steps.length - 1) {
              setActiveStepIndex((idx) => idx + 1);
            }
          }
        }

        return nextIdx;
      });
    }, intervalMs);

    return () => {
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
      }
    };
  }, [isSimulating, coordinates, simulationSpeedMultiplier, activeStepIndex, steps]);

  const liveDistanceToDestination = useMemo(() => {
    if (!navigationState.currentLocation || !route?.destination) {
      return null;
    }

    return getDistanceBetweenPoints(navigationState.currentLocation, route.destination);
  }, [navigationState.currentLocation, route]);

  const distanceToNextManeuver = useMemo(() => {
    if (!navigationState.currentLocation || !steps.length) return null;
    const currentStep = steps[activeStepIndex];
    if (!currentStep?.location?.length) return null;
    const targetPoint = { lon: currentStep.location[0], lat: currentStep.location[1] };
    return getDistanceBetweenPoints(navigationState.currentLocation, targetPoint);
  }, [navigationState.currentLocation, steps, activeStepIndex]);

  const progressPercent = useMemo(() => {
    if (!coordinates.length) return 0;
    if (isSimulating || navigationState.status === "simulating" || navigationState.status === "arrived") {
      return Math.min(100, Math.round((simulationIndex / (coordinates.length - 1)) * 100));
    }
    if (liveDistanceToDestination !== null && route?.distance) {
      const remaining = liveDistanceToDestination;
      const total = route.distance;
      return Math.max(0, Math.min(100, Math.round(((total - remaining) / total) * 100)));
    }
    return 0;
  }, [coordinates.length, isSimulating, navigationState.status, simulationIndex, liveDistanceToDestination, route]);

  return {
    navigationState,
    activeStepIndex,
    steps,
    isSimulating,
    simulationSpeedMultiplier,
    progressPercent,
    distanceToNextManeuver,
    liveDistanceToDestination,
    setActiveStepIndex,
    setSimulationSpeedMultiplier,
    startTrip,
    stopTrip,
    startSimulation,
    pauseSimulation,
    resetSimulation,
  };
}
