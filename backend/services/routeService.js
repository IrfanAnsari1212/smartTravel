const axios = require("axios");
const { routeCache } = require("./cacheService");

const ROUTE_BASE_URL =
  process.env.OSRM_BASE_URL || "https://router.project-osrm.org";
const ROUTE_TIMEOUT_MS = Number(process.env.OSRM_TIMEOUT_MS) || 8000;

const getRoute = async (start, destination) => {
  const cacheKey = `${Number(start.lon).toFixed(4)},${Number(start.lat).toFixed(4)}->${Number(destination.lon).toFixed(4)},${Number(destination.lat).toFixed(4)}`;
  const cached = routeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const url = `${ROUTE_BASE_URL}/route/v1/driving/${start.lon},${start.lat};${destination.lon},${destination.lat}?overview=full&geometries=geojson`;
  const response = await axios.get(url, {
    timeout: ROUTE_TIMEOUT_MS,
  });
  const route = response.data?.routes?.[0];

  if (!route?.geometry?.coordinates?.length) {
    const error = new Error(
      `No drivable route found between "${start.name}" and "${destination.name}".`
    );
    error.statusCode = 404;
    throw error;
  }

  routeCache.set(cacheKey, route);
  return route;
};

module.exports = { getRoute };
