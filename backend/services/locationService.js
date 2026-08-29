const { queryNominatim } = require("../adapters/nominatimAdapter");
const { geocodeCache } = require("./cacheService");

const searchPlaces = async (query) => {
  const normalizedQuery = query?.trim()?.toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  const cached = geocodeCache.get(normalizedQuery);
  if (cached) {
    return cached;
  }

  const results = await queryNominatim(normalizedQuery);
  geocodeCache.set(normalizedQuery, results);
  return results;
};

const getCoordinates = async (place) => {
  const results = await searchPlaces(place);

  if (!results.length) {
    const error = new Error(`No coordinates found for "${place}"`);
    error.statusCode = 404;
    throw error;
  }

  return {
    name: results[0].displayName,
    lat: results[0].lat,
    lon: results[0].lon,
  };
};

module.exports = {
  getCoordinates,
  searchPlaces,
};
