const { z } = require("zod");
const { getCoordinates } = require("../services/locationService");
const { getPlacesNearby } = require("../services/placeService");
const { getRoute } = require("../services/routeService");
const {
  saveTrip,
  listTrips,
  toggleFavorite,
} = require("../services/tripStore");
const { optimizeWaypoints } = require("../utils/routeOptimizer");
const { buildInitialMultiDayItinerary, recalculateDaySchedule } = require("../utils/itineraryEngine");
const Trip = require("../models/Trip");

const DEFAULT_TYPES = [
  "attraction",
  "restaurant",
  "hotel",
  "fuel",
  "hospital",
  "police",
  "mechanic",
  "pharmacy",
  "atm",
  "parking",
];
const ALL_TYPES = DEFAULT_TYPES;

const planTripSchema = z.object({
  start: z.string().trim().min(2, "Start location must be at least 2 characters."),
  destination: z.string().trim().min(2, "Destination must be at least 2 characters."),
  waypoints: z.array(z.string().trim().min(1)).max(8).optional(),
  optimize: z.boolean().optional(),
  avoidTolls: z.boolean().optional(),
  avoidHighways: z.boolean().optional(),
  filters: z.array(z.string()).optional(),
  maxPlaces: z.coerce.number().min(1).max(50).optional(),
});

const historyQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(20).optional(),
});

const createEmergencyServiceMaps = () => ({
  fuel: new Map(),
  hotel: new Map(),
  hospital: new Map(),
  police: new Map(),
  mechanic: new Map(),
});

const addEmergencyPlaces = (emergencyMaps, nearbyPlaces) => {
  nearbyPlaces.forEach((place) => {
    if (emergencyMaps[place.category] && !emergencyMaps[place.category].has(place.id)) {
      emergencyMaps[place.category].set(place.id, place);
    }
  });
};

const finalizeEmergencyServices = (emergencyMaps) => ({
  fuel: Array.from(emergencyMaps.fuel.values()),
  hotel: Array.from(emergencyMaps.hotel.values()),
  hospital: Array.from(emergencyMaps.hospital.values()),
  police: Array.from(emergencyMaps.police.values()),
  mechanic: Array.from(emergencyMaps.mechanic.values()),
});

const EMPTY_EMERGENCY_SERVICES = {
  fuel: [],
  hotel: [],
  hospital: [],
  police: [],
  mechanic: [],
};

const normalizeFilters = (filters) => {
  if (!Array.isArray(filters) || filters.length === 0) {
    return DEFAULT_TYPES;
  }
  return filters;
};

const planTrip = async (req, res, next) => {
  try {
    const {
      start,
      destination,
      waypoints = [],
      optimize = false,
      avoidTolls = false,
      avoidHighways = false,
      filters = DEFAULT_TYPES,
      maxPlaces = 20,
    } = planTripSchema.parse(req.body);

    const validWaypointStrings = waypoints.filter((w) => typeof w === "string" && w.trim().length > 1);

    const [startCoords, destCoords, ...waypointCoords] = await Promise.all([
      getCoordinates(start),
      getCoordinates(destination),
      ...validWaypointStrings.map((w) => getCoordinates(w)),
    ]);

    let orderedWaypoints = waypointCoords;
    if (optimize && waypointCoords.length > 1) {
      orderedWaypoints = optimizeWaypoints(startCoords, waypointCoords, destCoords);
    }

    const allRoutePoints = [startCoords, ...orderedWaypoints, destCoords];
    const route = await getRoute(allRoutePoints);
    const coordinates = route.geometry.coordinates;

    // Sample along the route: Start, ~25%, ~50%, ~75%, Destination
    const sampleIndices = [
      0,
      Math.floor(coordinates.length * 0.25),
      Math.floor(coordinates.length * 0.5),
      Math.floor(coordinates.length * 0.75),
      coordinates.length - 1,
    ].filter((idx, i, arr) => arr.indexOf(idx) === i && idx >= 0 && idx < coordinates.length);

    const points = sampleIndices.map((i) => coordinates[i]);
    const placeFilters = normalizeFilters(filters);
    const placesMap = new Map();
    const emergencyServiceMaps = createEmergencyServiceMaps();
    let placeLookupFailures = 0;

    const results = await Promise.allSettled(
      points.map(async (point) => {
        const [lon, lat] = point;
        return {
          point,
          places: await getPlacesNearby(lat, lon, ALL_TYPES),
        };
      })
    );

    results.forEach((res) => {
      if (res.status === "fulfilled") {
        const nearby = res.value.places;
        nearby.forEach((place) => {
          if (placeFilters.includes(place.category) && !placesMap.has(place.id)) {
            placesMap.set(place.id, place);
          }
        });
        addEmergencyPlaces(emergencyServiceMaps, nearby);
      } else {
        placeLookupFailures += 1;
        console.warn(`Nearby-place lookup failed: ${res.reason?.message}`);
      }
    });

    const places = Array.from(placesMap.values()).slice(
      0,
      Math.min(Number(maxPlaces) || 20, 50)
    );
    const emergencyServices = finalizeEmergencyServices(emergencyServiceMaps);

    const initialDays = buildInitialMultiDayItinerary(
      startCoords,
      destCoords,
      orderedWaypoints,
      places
    );

    const savedTrip = await saveTrip({
      userId: req.user.id,
      startQuery: start,
      destinationQuery: destination,
      start: startCoords,
      destination: destCoords,
      waypoints: orderedWaypoints,
      options: {
        avoidTolls: Boolean(avoidTolls),
        avoidHighways: Boolean(avoidHighways),
        optimized: Boolean(optimize && waypointCoords.length > 1),
      },
      filters: placeFilters,
      distance: route.distance,
      duration: route.duration,
      geometry: route.geometry,
      steps: route.steps || [],
      days: initialDays,
      places,
      emergencyServices,
      placeLookup: {
        status: placeLookupFailures === points.length ? "unavailable" : "available",
        failedPoints: placeLookupFailures,
      },
    });

    res.json({
      tripId: savedTrip.id,
      start: startCoords,
      destination: destCoords,
      waypoints: savedTrip.waypoints || orderedWaypoints || [],
      options: savedTrip.options || { avoidTolls, avoidHighways, optimized: optimize },
      distance: route.distance,
      duration: route.duration,
      geometry: route.geometry,
      steps: savedTrip.steps || route.steps || [],
      days: savedTrip.days || initialDays,
      places,
      emergencyServices: savedTrip.emergencyServices || EMPTY_EMERGENCY_SERVICES,
      filters: placeFilters,
      placeLookup: savedTrip.placeLookup,
    });
  } catch (error) {
    console.error("Trip Error:", error.response?.data || error.message);
    next(error);
  }
};

const getTripHistory = async (req, res, next) => {
  try {
    const { limit = 6 } = historyQuerySchema.parse(req.query);
    const trips = await listTrips(req.user.id, limit);
    res.json(trips);
  } catch (error) {
    next(error);
  }
};

const updateFavoriteTrip = async (req, res, next) => {
  try {
    const trip = await toggleFavorite(req.params.id, req.user.id);
    res.json(trip);
  } catch (error) {
    next(error);
  }
};

const updateTripItinerary = async (req, res, next) => {
  try {
    const { days } = req.body;
    if (!Array.isArray(days)) {
      const error = new Error("Days array is required");
      error.statusCode = 400;
      throw error;
    }

    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) {
      const error = new Error("Trip not found");
      error.statusCode = 404;
      throw error;
    }

    // Recalculate schedule for each day
    const recalculatedDays = days.map((day, idx) =>
      recalculateDaySchedule({
        ...day,
        dayNumber: idx + 1,
      })
    );

    trip.days = recalculatedDays;
    await trip.save();

    res.json({
      message: "Itinerary updated successfully",
      days: trip.days,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  planTrip,
  getTripHistory,
  updateFavoriteTrip,
  updateTripItinerary,
};
