import axios from "axios";
import { API_BASE_URL } from "./api";

const memoryCache = new Map();

export const searchPlaces = async (query) => {
  const normalized = query?.trim()?.toLowerCase();
  if (!normalized) {
    return [];
  }

  const cacheKey = `search:${normalized}`;
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey);
  }

  const response = await axios.get(`${API_BASE_URL}/locations/search`, {
    params: { q: normalized },
  });

  const results = Array.isArray(response.data) ? response.data : [];
  memoryCache.set(cacheKey, results);
  return results;
};

export const reverseGeocodePlace = async (lat, lon) => {
  const cacheKey = `reverse:${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}`;
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey);
  }

  const response = await axios.get(`${API_BASE_URL}/locations/reverse`, {
    params: { lat, lon },
  });

  const result = response.data;
  memoryCache.set(cacheKey, result);
  return result;
};
