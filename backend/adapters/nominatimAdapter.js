const axios = require("axios");
const { withRetry } = require("../utils/retry");

const SEARCH_BASE_URL =
  process.env.NOMINATIM_BASE_URL || "https://nominatim.openstreetmap.org";
const SEARCH_TIMEOUT_MS = Number(process.env.NOMINATIM_TIMEOUT_MS) || 8000;
const REQUEST_HEADERS = {
  "User-Agent": process.env.NOMINATIM_USER_AGENT || "smarttravel/1.0 (contact: support@smarttravel.local)",
  Accept: "application/json",
};

const normalizePlace = (place) => ({
  placeId: place.place_id,
  displayName: place.display_name,
  lat: Number(place.lat),
  lon: Number(place.lon),
});

const queryNominatim = async (query) => {
  if (!query?.trim()) {
    return [];
  }

  return withRetry(async () => {
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

    if (!Array.isArray(response.data)) {
      return [];
    }

    return response.data.map(normalizePlace);
  });
};

const reverseNominatim = async (lat, lon) => {
  return withRetry(async () => {
    const response = await axios.get(`${SEARCH_BASE_URL}/reverse`, {
      headers: REQUEST_HEADERS,
      params: {
        lat,
        lon,
        format: "jsonv2",
        addressdetails: 1,
      },
      timeout: SEARCH_TIMEOUT_MS,
    });

    if (!response.data || response.data.error) {
      const error = new Error(response.data?.error || `No address found at coordinates [${lat}, ${lon}]`);
      error.statusCode = 404;
      throw error;
    }

    return normalizePlace(response.data);
  });
};

module.exports = {
  queryNominatim,
  reverseNominatim,
  normalizePlace,
};
