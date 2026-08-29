const { getCoordinates } = require("../services/locationService");
const { getRoute } = require("../services/routeService");
const { ALL_TYPES, getPlacesNearby } = require("../services/placeService");
const { listTrips, saveTrip, toggleFavorite } = require("../services/tripStore");
const { z } = require("zod");

const DEFAULT_FILTERS = ["restaurant", "hotel", "fuel", "hospital", "mechanic"];
const EMPTY_EMERGENCY_SERVICES = {
  fuel: [],
  hotel: [],
  hospital: [],
  mechanic: [],
};

const planTripSchema = z.object({
  start: z.string().trim().min(1).max(300),
  destination: z.string().trim().min(1).max(300),
  filters: z.array(z.string().trim()).optional(),
  maxPlaces: z.coerce.number().int().min(1).max(20).optional(),
});
const historyQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(20).optional() });

const normalizeFilters = (filters) => {
  if (!Array.isArray(filters) || !filters.length) {
    return DEFAULT_FILTERS;
  }

  const valid = filters.filter((filter) => ALL_TYPES.includes(filter));
  return valid.length ? valid : DEFAULT_FILTERS;
};

const createEmergencyServiceMaps = () => ({
  fuel: new Map(),
  hotel: new Map(),
  hospital: new Map(),
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

const finalizeEmergencyServices = (serviceMaps, limit = 4) =>
  Object.fromEntries(
    Object.entries(serviceMaps).map(([category, placesMap]) => [
      category,
      Array.from(placesMap.values()).slice(0, limit),
    ])
  );

const planTrip = async (req, res, next) => {
  try {
    const { start, destination, filters = DEFAULT_FILTERS, maxPlaces = 10 } = planTripSchema.parse(req.body);

    const startCoords = await getCoordinates(start);
    const destCoords = await getCoordinates(destination);
    const route = await getRoute(startCoords, destCoords);
    const coordinates = route.geometry.coordinates;
    const points = [
      coordinates[0],
      coordinates[Math.floor(coordinates.length / 2)],
      coordinates[coordinates.length - 1],
    ];
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
      Math.min(Number(maxPlaces) || 10, 20)
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
