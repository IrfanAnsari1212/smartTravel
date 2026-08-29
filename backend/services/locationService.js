const { queryNominatim, reverseNominatim } = require("../adapters/nominatimAdapter");
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

const reverseGeocode = async (lat, lon) => {
  const cacheKey = `rev:${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}`;
  const cached = geocodeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const result = await reverseNominatim(lat, lon);
  geocodeCache.set(cacheKey, result);
  return result;
};

module.exports = {
  getCoordinates,
  reverseGeocode,
  searchPlaces,
};
