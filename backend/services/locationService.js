const axios = require("axios");

const SEARCH_BASE_URL =
  process.env.NOMINATIM_BASE_URL || "https://nominatim.openstreetmap.org";
const SEARCH_TIMEOUT_MS = Number(process.env.NOMINATIM_TIMEOUT_MS) || 8000;
const REQUEST_HEADERS = {
  "User-Agent": process.env.NOMINATIM_USER_AGENT || "travel-platform/1.0",
  Accept: "application/json",
};

const normalizePlace = (place) => ({
  placeId: place.place_id,
  displayName: place.display_name,
  lat: Number(place.lat),
  lon: Number(place.lon),
});

const searchPlaces = async (query) => {
  if (!query?.trim()) {
    return [];
  }

  const response = await axios.get(`${SEARCH_BASE_URL}/search`, {
    headers: REQUEST_HEADERS,
    params: {
      q: query.trim(),
      format: "jsonv2",
      limit: 5,
      addressdetails: 1,
    },
    timeout: SEARCH_TIMEOUT_MS,
  });

  return response.data.map(normalizePlace);
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
