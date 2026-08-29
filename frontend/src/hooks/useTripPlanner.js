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
            setStart(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);
            setLocationStatus("found");
            setLocationMessage("Coordinates acquired.");
          }
        } catch {
          // If reverse geocoding fails, fallback to coordinates
          const coordsLabel = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
          setStart(coordsLabel);
          setLocationStatus("found");
          setLocationMessage("Using raw coordinates (reverse geocoding unavailable).");
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus("denied");
          setLocationMessage(
            isAuto
              ? ""
              : "Location permission was denied. You can enter a starting place manually."
          );
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationStatus("unavailable");
          setLocationMessage("Location information is currently unavailable.");
        } else if (error.code === error.TIMEOUT) {
          setLocationStatus("error");
          setLocationMessage("Location request timed out. Please try again.");
        } else {
          setLocationStatus("error");
          setLocationMessage(error.message || "Failed to retrieve location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  // Automatic current-location detection on initial load
  useEffect(() => {
    if (!hasAutoLocated.current && !start) {
      hasAutoLocated.current = true;
      detectCurrentLocation(true);
    }
  }, [detectCurrentLocation, start]);

  const clearSearchState = (key, setter) => {
    clearTimeout(searchTimeouts.current[key]);
    searchRequestIds.current[key] = (searchRequestIds.current[key] || 0) + 1;
    setter([]);
  };

  const handleSearch = (value, setter, key) => {
    clearTimeout(searchTimeouts.current[key]);
    const requestId = (searchRequestIds.current[key] || 0) + 1;
    searchRequestIds.current[key] = requestId;

    if (!value.trim()) {
      setter([]);
      return;
    }

    searchTimeouts.current[key] = setTimeout(async () => {
      try {
        const results = await searchPlaces(value);
        if (searchRequestIds.current[key] === requestId) {
          setter(results);
        }
      } catch (error) {
        if (searchRequestIds.current[key] === requestId) {
          setter([]);
          setErrorMessage(error.response?.data?.message || "Location search is temporarily unavailable.");
        }
      }
    }, 300);
  };

  const toggleFilter = (filterId) => {
    setSelectedFilters((current) => {
      if (current.includes(filterId)) {
        return current.length === 1
          ? current
          : current.filter((item) => item !== filterId);
      }
      return [...current, filterId];
    });
  };

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
      setErrorMessage("Enter both locations to plan a trip.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const plannedTrip = await planTripRequest({
        start,
        destination,
        filters: selectedFilters,
      });

      // Save valid start & destination into recent searches
      addRecentSearch(start);
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

  const applyHistoryTrip = (trip, onApply) => {
    if (onApply) onApply();
    setStart(trip.startQuery);
    setDestination(trip.destinationQuery);
    setSelectedFilters(trip.filters?.length ? trip.filters : ALL_FILTER_IDS);
    setRoute(tripFromHistory(trip));
    setFocusedSafetyPlace(null);
    clearSearchState("start", setStartSuggestions);
    clearSearchState("destination", setDestSuggestions);
    setErrorMessage("");
  };

  const openOfflineTrip = (trip, onOpen) => {
    if (onOpen) onOpen();
    setStart(trip.startQuery);
    setDestination(trip.destinationQuery);
    setSelectedFilters(trip.filters?.length ? trip.filters : ALL_FILTER_IDS);
    setRoute(routeFromOfflineTrip(trip));
    setFocusedSafetyPlace(null);
    clearSearchState("start", setStartSuggestions);
    clearSearchState("destination", setDestSuggestions);
    setErrorMessage("");
  };

  return {
    start,
    setStart,
    destination,
    setDestination,
    route,
    setRoute,
    history,
    setHistory,
    loading,
    historyLoading,
    errorMessage,
    setErrorMessage,
    startSuggestions,
    setStartSuggestions,
    destSuggestions,
    setDestSuggestions,
    selectedFilters,
    setSelectedFilters,
    focusedSafetyPlace,
    setFocusedSafetyPlace,
    locationStatus,
    locationMessage,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    detectCurrentLocation,
    handleSearch,
    clearSearchState,
    toggleFilter,
    planTrip,
    loadTripHistory,
    handleFavoriteToggle,
    applyHistoryTrip,
    openOfflineTrip,
  };
}
