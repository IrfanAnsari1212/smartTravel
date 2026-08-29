const { fetchWeatherFromProvider } = require("../adapters/weatherProvider");
const { getCoordinates } = require("./locationService");
const { SimpleCache } = require("./cacheService");

// 30 minute TTL for weather cache
const weatherCache = new SimpleCache(30 * 60 * 1000, 300);

/**
 * Retrieves weather forecast and warnings for a single location
 */
const getPointWeather = async ({ lat, lon, name = "", query = "" }) => {
  let pointLat = lat;
  let pointLon = lon;
  let pointName = name;

  if (query && (!Number.isFinite(pointLat) || !Number.isFinite(pointLon))) {
    const coords = await getCoordinates(query);
    pointLat = coords.lat;
    pointLon = coords.lon;
    pointName = coords.name;
  }

  if (!Number.isFinite(pointLat) || !Number.isFinite(pointLon)) {
    const error = new Error("Valid coordinates or location query is required for weather lookup");
    error.statusCode = 400;
    throw error;
  }

  const cacheKey = `wx:${pointLat.toFixed(2)},${pointLon.toFixed(2)}`;
  const cached = weatherCache.get(cacheKey);
  if (cached) {
    return { ...cached, name: pointName || cached.name };
  }

  const weatherData = await fetchWeatherFromProvider(pointLat, pointLon, 5);
  const result = {
    ...weatherData,
    name: pointName,
  };

  weatherCache.set(cacheKey, result);
  return result;
};

/**
 * Retrieves weather forecasts and aggregate severe warnings for all route points
 */
const getRouteWeatherForecast = async ({ start, destination, waypoints = [], stops = [] }) => {
  const pointsToQuery = [];

  if (start?.lat && start?.lon) {
    pointsToQuery.push({ name: start.name || "Start", lat: start.lat, lon: start.lon, role: "start" });
  }

  (waypoints || []).forEach((wp, idx) => {
    if (wp?.lat && wp?.lon) {
      pointsToQuery.push({ name: wp.name || `Stop ${idx + 1}`, lat: wp.lat, lon: wp.lon, role: "waypoint" });
    }
  });

  (stops || []).forEach((s, idx) => {
    if (s?.lat && s?.lon && !pointsToQuery.some((p) => Math.abs(p.lat - s.lat) < 0.05 && Math.abs(p.lon - s.lon) < 0.05)) {
      pointsToQuery.push({ name: s.name || `Itinerary Stop ${idx + 1}`, lat: s.lat, lon: s.lon, role: "stop" });
    }
  });

  if (destination?.lat && destination?.lon) {
    pointsToQuery.push({ name: destination.name || "Destination", lat: destination.lat, lon: destination.lon, role: "destination" });
  }

  // Query weather for all points in parallel
  const weatherResults = await Promise.allSettled(
    pointsToQuery.map(async (point) => {
      const weather = await getPointWeather({ lat: point.lat, lon: point.lon, name: point.name });
      return {
        ...point,
        weather,
      };
    })
  );

  const pointsWeather = [];
  const allWarnings = [];

  weatherResults.forEach((res) => {
    if (res.status === "fulfilled") {
      pointsWeather.push(res.value);
      (res.value.weather?.warnings || []).forEach((w) => {
        allWarnings.push({
          ...w,
          location: res.value.name,
          role: res.value.role,
        });
      });
    }
  });

  return {
    totalPoints: pointsWeather.length,
    pointsWeather,
    severeWarnings: allWarnings,
    hasSevereWarnings: allWarnings.some((w) => w.severity === "high"),
  };
};

module.exports = {
  getPointWeather,
  getRouteWeatherForecast,
  weatherCache,
};
