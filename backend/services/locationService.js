const { queryNominatim, reverseNominatim } = require("../adapters/nominatimAdapter");
const { geocodeCache } = require("./cacheService");

const cleanPlaceString = (place = "") => {
  return place
    .replace(/^📍\s*/, "")
    .replace(/^Current location:?\s*/i, "")
    .trim();
};

const searchPlaces = async (query) => {
  const cleaned = cleanPlaceString(query);
  const normalizedQuery = cleaned?.toLowerCase();
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
  const cleaned = cleanPlaceString(place);
  if (!cleaned) {
    const error = new Error("Location query is required");
    error.statusCode = 400;
    throw error;
  }

  // Check if direct coordinates e.g. "28.6139, 77.2090"
  const coordinateMatch = cleaned.match(
    /^([-+]?\d{1,2}(?:\.\d+)?)\s*,\s*([-+]?\d{1,3}(?:\.\d+)?)$/
  );
  if (coordinateMatch) {
    const lat = Number(coordinateMatch[1]);
    const lon = Number(coordinateMatch[2]);
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return {
        name: `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
        lat,
        lon,
      };
    }
  }

  const results = await searchPlaces(cleaned);

  if (!results.length) {
    const error = new Error(`No coordinates found for "${cleaned}"`);
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
  cleanPlaceString,
  getCoordinates,
  reverseGeocode,
  searchPlaces,
};
