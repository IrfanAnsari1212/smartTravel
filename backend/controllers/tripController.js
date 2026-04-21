const { getCoordinates } = require("../services/locationService");
const { getRoute } = require("../services/routeService");
const { getPlacesNearby } = require("../services/placeService");
const { listTrips, saveTrip, toggleFavorite } = require("../services/tripStore");

const DEFAULT_FILTERS = ["restaurant", "hotel", "fuel"];
const EMERGENCY_FILTERS = ["fuel", "hotel", "hospital", "mechanic"];
const EMPTY_EMERGENCY_SERVICES = {
  fuel: [],
  hotel: [],
  hospital: [],
  mechanic: [],
};

const normalizeFilters = (filters) => {
  if (!Array.isArray(filters) || !filters.length) {
    return DEFAULT_FILTERS;
  }

  return filters.filter((filter) => DEFAULT_FILTERS.includes(filter));
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
    const { start, destination, filters = DEFAULT_FILTERS, maxPlaces = 10 } =
      req.body;

    if (!start || !destination) {
      return res
        .status(400)
        .json({ message: "Start and destination are required" });
    }

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

    for (const point of points) {
      const [lon, lat] = point;

      try {
        const [nearby, nearbyEmergency] = await Promise.all([
          getPlacesNearby(lat, lon, placeFilters),
          getPlacesNearby(lat, lon, EMERGENCY_FILTERS),
        ]);

        nearby.forEach((place) => {
          if (!placesMap.has(place.id)) {
            placesMap.set(place.id, place);
          }
        });

        addEmergencyPlaces(emergencyServiceMaps, nearbyEmergency);
      } catch (error) {
        console.log("Skipping one point");
      }
    }

    const places = Array.from(placesMap.values()).slice(
      0,
      Math.min(Number(maxPlaces) || 10, 20)
    );
    const emergencyServices = finalizeEmergencyServices(emergencyServiceMaps);

    const savedTrip = await saveTrip({
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
    });
  } catch (error) {
    console.error("Trip Error:", error.response?.data || error.message);
    next(error);
  }
};



const getTripHistory = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 6, 20);
    const trips = await listTrips(limit);
    res.json(trips);
  } catch (error) {
    next(error);
  }
};

const updateFavoriteTrip = async (req, res, next) => {
  try {
    const trip = await toggleFavorite(req.params.id);

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
