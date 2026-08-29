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

module.exports = {
  queryNominatim,
  normalizePlace,
};
