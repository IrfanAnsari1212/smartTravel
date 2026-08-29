import { useCallback, useEffect, useRef, useState } from "react";
import { reverseGeocodePlace, searchPlaces } from "../services/locationService";
import { getTripHistory, planTripRequest, toggleFavoriteTrip } from "../services/tripService";
import {
  ALL_FILTER_IDS,
  routeFromOfflineTrip,
  tripFromHistory,
} from "../utils/formatters";

const RECENT_SEARCHES_KEY = "smart-travel-recent-searches-v1";
const MAX_RECENT_SEARCHES = 6;
const MAX_WAYPOINTS = 5;

const getStoredRecentSearches = () => {
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const storeRecentSearches = (searches) => {
  try {
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
  } catch {
    // Ignore localStorage write failures
  }
};

export function useTripPlanner(session, isOnline) {
  const [start, setStart] = useState("");
  const [destination, setDestination] = useState("");
  const [waypoints, setWaypoints] = useState([]); // Array of strings e.g. ["Mathura"]
  const [waypointSuggestions, setWaypointSuggestions] = useState({}); // { [index]: suggestionsArray }
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [avoidHighways, setAvoidHighways] = useState(false);
  const [optimize, setOptimize] = useState(false);

  const [route, setRoute] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState(ALL_FILTER_IDS);
  const [focusedSafetyPlace, setFocusedSafetyPlace] = useState(null);

  const [locationStatus, setLocationStatus] = useState("idle"); // idle | locating | found | denied | unavailable | error
  const [locationMessage, setLocationMessage] = useState("");
  const [recentSearches, setRecentSearches] = useState(getStoredRecentSearches);

  const searchTimeouts = useRef({});
  const searchRequestIds = useRef({});
  const hasAutoLocated = useRef(false);

  const addRecentSearch = useCallback((query) => {
    const trimmed = query?.trim();
    if (!trimmed || trimmed.length < 2) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      storeRecentSearches(updated);
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    storeRecentSearches([]);
  }, []);

  // Waypoint Management Handlers
  const addWaypoint = useCallback(() => {
    setWaypoints((prev) => {
      if (prev.length >= MAX_WAYPOINTS) return prev;
      return [...prev, ""];
    });
  }, []);

  const removeWaypoint = useCallback((index) => {
    setWaypoints((prev) => prev.filter((_, i) => i !== index));
    setWaypointSuggestions((prev) => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
  }, []);

  const updateWaypoint = useCallback((index, value) => {
    setWaypoints((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  }, []);

  const moveWaypointUp = useCallback((index) => {
    if (index <= 0) return;
    setWaypoints((prev) => {
      const updated = [...prev];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  }, []);

  const moveWaypointDown = useCallback((index) => {
    setWaypoints((prev) => {
      if (index >= prev.length - 1) return prev;
      const updated = [...prev];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  }, []);

  const detectCurrentLocation = useCallback((isAuto = false) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      if (!isAuto) {
        setLocationStatus("unavailable");
        setLocationMessage("Geolocation is not supported by your browser.");
      }
      return;
    }

    setLocationStatus("locating");
    setLocationMessage("Acquiring current location...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const place = await reverseGeocodePlace(lat, lon);

          if (place?.displayName) {
            setStart(place.displayName);
            setLocationStatus("found");
            setLocationMessage(`Location acquired: ${place.displayName}`);
          } else {
            setLocationStatus("found");
            setLocationMessage("Acquired current GPS coordinates.");
          }
        } catch {
          setLocationStatus("error");
          setLocationMessage("Unable to reverse geocode your coordinates.");
        }
      },
      (err) => {
        if (err.code === 1) {
          setLocationStatus("denied");
          setLocationMessage("Location permission was denied.");
        } else {
          setLocationStatus("error");
          setLocationMessage("Location unavailable or timed out.");
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    if (hasAutoLocated.current) return;
    hasAutoLocated.current = true;
    if (!start && typeof window !== "undefined" && navigator.geolocation) {
      detectCurrentLocation(true);
    }
  }, [detectCurrentLocation, start]);

  const handleSearch = useCallback(
    (query, setter, typeKey = "start") => {
      const trimmed = query.trim();

      if (searchTimeouts.current[typeKey]) {
        clearTimeout(searchTimeouts.current[typeKey]);
      }

      if (trimmed.length < 2) {
        setter([]);
        return;
      }

      const requestId = Date.now();
      searchRequestIds.current[typeKey] = requestId;

      searchTimeouts.current[typeKey] = setTimeout(async () => {
        try {
          const results = await searchPlaces(trimmed);
          if (searchRequestIds.current[typeKey] === requestId) {
            setter(results);
          }
        } catch (error) {
          if (searchRequestIds.current[typeKey] === requestId) {
            console.error(error);
            setter([]);
          }
        }
      }, 300);
    },
    []
  );

  const clearSearchState = useCallback((typeKey, setter) => {
    if (searchTimeouts.current[typeKey]) {
      clearTimeout(searchTimeouts.current[typeKey]);
    }
    delete searchRequestIds.current[typeKey];
    setter([]);
  }, []);

  const toggleFilter = useCallback((filterId) => {
    setSelectedFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((id) => id !== filterId)
        : [...prev, filterId]
    );
  }, []);

  const loadTripHistory = useCallback(async () => {
    if (!isOnline || !session) {
      setHistoryLoading(false);
      return;
    }

    setHistoryLoading(true);

    try {
      const trips = await getTripHistory();
      setHistory(Array.isArray(trips) ? trips : []);
    } catch (error) {
      console.error(error);
    } finally {
      setHistoryLoading(false);
    }
  }, [isOnline, session]);

  useEffect(() => {
    loadTripHistory();
  }, [loadTripHistory]);

  useEffect(() => {
    const activeSearchTimeouts = searchTimeouts.current;
    return () => {
      Object.values(activeSearchTimeouts).forEach(clearTimeout);
    };
  }, []);

  const planTrip = async (onPlanSuccess) => {
    if (!session) {
      setErrorMessage("Sign in to plan and save a trip.");
      return;
    }
    if (!isOnline) {
      setErrorMessage(
        "You are offline. Open a saved offline trip or import a trip pack instead."
      );
      return;
    }

    if (!start.trim() || !destination.trim()) {
      setErrorMessage("Enter both start and destination locations to plan a trip.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const validWaypoints = waypoints.filter((w) => w && w.trim().length > 1);

      const plannedTrip = await planTripRequest({
        start,
        destination,
        waypoints: validWaypoints,
        optimize,
        avoidTolls,
        avoidHighways,
        filters: selectedFilters,
      });

      // Save valid start, waypoints & destination into recent searches
      addRecentSearch(start);
      validWaypoints.forEach((w) => addRecentSearch(w));
      addRecentSearch(destination);

      setFocusedSafetyPlace(null);
      clearSearchState("start", setStartSuggestions);
      clearSearchState("destination", setDestSuggestions);
      setRoute(plannedTrip);

      if (onPlanSuccess) {
        onPlanSuccess(plannedTrip);
      }

      await loadTripHistory();
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error.response?.data?.message || "Unable to plan the trip right now."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = async (tripId) => {
    try {
      const updatedTrip = await toggleFavoriteTrip(tripId);
      setHistory((current) =>
        current
          .map((trip) => (trip.id === tripId ? updatedTrip : trip))
          .sort((a, b) => Number(b.favorite) - Number(a.favorite))
      );
    } catch (error) {
      console.error(error);
    }
  };

  const selectHistoryTrip = (trip) => {
    setStart(trip.start?.name || trip.startQuery || "");
    setDestination(trip.destination?.name || trip.destinationQuery || "");
    if (Array.isArray(trip.waypoints)) {
      setWaypoints(trip.waypoints.map((w) => w.name || ""));
    } else {
      setWaypoints([]);
    }
    setRoute(tripFromHistory(trip));
    setFocusedSafetyPlace(null);
  };

  const loadOfflineTripIntoPlanner = (offlineTrip) => {
    setStart(offlineTrip.start?.name || offlineTrip.startQuery || "");
    setDestination(offlineTrip.destination?.name || offlineTrip.destinationQuery || "");
    if (Array.isArray(offlineTrip.waypoints)) {
      setWaypoints(offlineTrip.waypoints.map((w) => w.name || ""));
    } else {
      setWaypoints([]);
    }
    setRoute(routeFromOfflineTrip(offlineTrip));
    setFocusedSafetyPlace(null);
  };

  return {
    start,
    setStart,
    destination,
    setDestination,
    waypoints,
    waypointSuggestions,
    setWaypointSuggestions,
    addWaypoint,
    removeWaypoint,
    updateWaypoint,
    moveWaypointUp,
    moveWaypointDown,
    avoidTolls,
    setAvoidTolls,
    avoidHighways,
    setAvoidHighways,
    optimize,
    setOptimize,
    route,
    setRoute,
    history,
    loading,
    historyLoading,
    errorMessage,
    setErrorMessage,
    startSuggestions,
    destSuggestions,
    selectedFilters,
    focusedSafetyPlace,
    setFocusedSafetyPlace,
    locationStatus,
    locationMessage,
    recentSearches,
    clearRecentSearches,
    detectCurrentLocation,
    handleSearch,
    clearSearchState,
    setStartSuggestions,
    setDestSuggestions,
    toggleFilter,
    planTrip,
    handleFavoriteToggle,
    selectHistoryTrip,
    loadOfflineTripIntoPlanner,
    addRecentSearch,
  };
}
