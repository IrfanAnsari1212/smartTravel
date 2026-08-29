const { getCoordinates } = require("../services/locationService");
const { getRoute } = require("../services/routeService");
const { ALL_TYPES, DEFAULT_TYPES, getPlacesNearby } = require("../services/placeService");
const { listTrips, saveTrip, toggleFavorite } = require("../services/tripStore");
const { z } = require("zod");

const EMPTY_EMERGENCY_SERVICES = {
  fuel: [],
  hotel: [],
  hospital: [],
  police: [],
  mechanic: [],
};

const planTripSchema = z.object({
  start: z.string().trim().min(1).max(300),
  destination: z.string().trim().min(1).max(300),
  filters: z.array(z.string().trim()).optional(),
  maxPlaces: z.coerce.number().int().min(1).max(50).optional(),
});

const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).optional(),
});

const normalizeFilters = (filters) => {
  if (!Array.isArray(filters) || !filters.length) {
    return ALL_TYPES;
  }

  const valid = filters.filter((filter) => ALL_TYPES.includes(filter));
  return valid.length ? valid : ALL_TYPES;
};

const createEmergencyServiceMaps = () => ({
  fuel: new Map(),
  hotel: new Map(),
  hospital: new Map(),
  police: new Map(),
  mechanic: new Map(),
});

const addEmergencyPlaces = (serviceMaps, places) => {
  places.forEach((place) => {
    const targetMap = serviceMaps[place.category];

    if (targetMap && !targetMap.has(place.id)) {
      targetMap.set(place.id, place);
    }
  });
};

const finalizeEmergencyServices = (serviceMaps, limit = 5) =>
  Object.fromEntries(
    Object.entries(serviceMaps).map(([category, placesMap]) => [
      category,
      Array.from(placesMap.values()).slice(0, limit),
    ])
  );

const planTrip = async (req, res, next) => {
  try {
    const {
      start,
      destination,
      filters = DEFAULT_TYPES,
      maxPlaces = 20,
    } = planTripSchema.parse(req.body);

    const startCoords = await getCoordinates(start);
    const destCoords = await getCoordinates(destination);
    const route = await getRoute(startCoords, destCoords);
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

    for (const point of points) {
      const [lon, lat] = point;

      try {
        const nearby = await getPlacesNearby(lat, lon, ALL_TYPES);

        nearby.forEach((place) => {
          if (placeFilters.includes(place.category) && !placesMap.has(place.id)) {
            placesMap.set(place.id, place);
          }
        });

        addEmergencyPlaces(emergencyServiceMaps, nearby);
      } catch (error) {
        placeLookupFailures += 1;
        console.warn(`Nearby-place lookup failed for [${lat}, ${lon}]: ${error.message}`);
      }
    }

    const places = Array.from(placesMap.values()).slice(
      0,
      Math.min(Number(maxPlaces) || 20, 50)
    );
    const emergencyServices = finalizeEmergencyServices(emergencyServiceMaps);

    const savedTrip = await saveTrip({
      userId: req.user.id,
      startQuery: start,
      destinationQuery: destination,
      start: startCoords,
      destination: destCoords,
      filters: placeFilters,
      distance: route.distance,
      duration: route.duration,
      geometry: route.geometry,
      steps: route.steps || [],
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
      distance: route.distance,
      duration: route.duration,
      geometry: route.geometry,
      steps: savedTrip.steps || route.steps || [],
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

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    res.json(trip);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTripHistory,
  planTrip,
  updateFavoriteTrip,
};
