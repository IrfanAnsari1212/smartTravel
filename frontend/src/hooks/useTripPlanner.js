import { useCallback, useEffect, useRef, useState } from "react";
import { searchPlaces } from "../services/locationService";
import { getTripHistory, planTripRequest, toggleFavoriteTrip } from "../services/tripService";
import {
  ALL_FILTER_IDS,
  routeFromOfflineTrip,
  tripFromHistory,
} from "../utils/formatters";

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

  const searchTimeouts = useRef({});
  const searchRequestIds = useRef({});

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

