import { useEffect, useMemo, useRef, useState } from "react";
import { getDistanceBetweenPoints } from "../utils/formatters";

export function useLiveNavigation(route) {
  const [navigationState, setNavigationState] = useState({
    isActive: false,
    status: "idle",
    currentLocation: null,
    error: "",
  });

  const locationWatchRef = useRef(null);

  const stopTrip = (status = "idle", error = "") => {
    if (locationWatchRef.current !== null && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(locationWatchRef.current);
      locationWatchRef.current = null;
    }

    setNavigationState((current) => ({
      ...current,
      isActive: false,
      status,
      error,
    }));
  };

  const startTrip = (onError) => {
    if (!route) {
      if (onError) onError("Plan a route before starting a trip.");
      return;
    }

    if (!("geolocation" in navigator)) {
      if (onError) onError("Geolocation is not supported on this device.");
      return;
    }

    if (locationWatchRef.current !== null) {
      navigator.geolocation.clearWatch(locationWatchRef.current);
      locationWatchRef.current = null;
    }

    setNavigationState((current) => ({
      ...current,
      isActive: true,
      status: "requesting",
      error: "",
    }));

    locationWatchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setNavigationState({
          isActive: true,
          status: "tracking",
          error: "",
          currentLocation: {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
            timestamp: position.timestamp,
          },
        });
      },
      (error) => {
        stopTrip("error", error.message || "Unable to access your location.");
        if (onError) onError(error.message || "Unable to access your location.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000,
      }
    );
  };

  useEffect(() => {
    return () => {
      if (locationWatchRef.current !== null && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(locationWatchRef.current);
      }
    };
  }, []);

  const liveDistanceToDestination = useMemo(() => {
    if (!navigationState.currentLocation || !route?.destination) {
      return null;
    }

    return getDistanceBetweenPoints(navigationState.currentLocation, route.destination);
  }, [navigationState.currentLocation, route]);

  return {
    navigationState,
    setNavigationState,
    startTrip,
    stopTrip,
    liveDistanceToDestination,
  };
}
