const { queryNearbyHotels } = require("../adapters/hotelProvider");
const { getCoordinates } = require("./locationService");
const { getHaversineDistance } = require("../utils/routeOptimizer");
const { placesCache } = require("./cacheService");

/**
 * Service orchestrating hotel searches across location or destination
 */
const findHotels = async ({
  lat,
  lon,
  query,
  radius = 10000,
  checkIn,
  checkOut,
  guests = 2,
  rooms = 1,
}) => {
  let searchLat = lat;
  let searchLon = lon;
  let locationName = "";

  if (query && (!Number.isFinite(searchLat) || !Number.isFinite(searchLon))) {
    const coords = await getCoordinates(query);
    searchLat = coords.lat;
    searchLon = coords.lon;
    locationName = coords.name;
  }

  if (!Number.isFinite(searchLat) || !Number.isFinite(searchLon)) {
    const error = new Error("Valid coordinates or location query is required");
    error.statusCode = 400;
    throw error;
  }

  const cacheKey = `hotels:${searchLat.toFixed(3)},${searchLon.toFixed(3)}:${radius}:${guests}:${rooms}`;
  const cached = placesCache.get(cacheKey);
  if (cached) {
    return {
      searchCenter: { lat: searchLat, lon: searchLon, name: locationName },
      checkIn: checkIn || null,
      checkOut: checkOut || null,
      guests,
      rooms,
      totalFound: cached.length,
      hotels: cached,
    };
  }

  const hotels = await queryNearbyHotels({
    lat: searchLat,
    lon: searchLon,
    radius,
    checkIn,
    checkOut,
    guests,
    rooms,
  });

  // Calculate distance and sort by closest
  const enriched = hotels
    .map((h) => ({
      ...h,
      distanceMeters: Math.round(
        getHaversineDistance(
          { lat: searchLat, lon: searchLon },
          { lat: h.lat, lon: h.lon }
        )
      ),
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  placesCache.set(cacheKey, enriched);

  return {
    searchCenter: { lat: searchLat, lon: searchLon, name: locationName },
    checkIn: checkIn || null,
    checkOut: checkOut || null,
    guests,
    rooms,
    totalFound: enriched.length,
    hotels: enriched,
  };
};

module.exports = {
  findHotels,
};

