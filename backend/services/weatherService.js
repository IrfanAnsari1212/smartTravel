const axios = require("axios");

const OPEN_METEO_BASE = "https://api.open-meteo.com/v1";
const TIMEOUT_MS = 8000;

// WMO weather interpretation codes → human-readable
const WMO_DESCRIPTIONS = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Icy fog",
  51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain",
  71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains",
  80: "Light showers", 81: "Showers", 82: "Violent showers",
  85: "Snow showers", 86: "Heavy snow showers",
  95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Thunderstorm with heavy hail",
};

const SEVERE_WMO_CODES = new Set([65, 75, 82, 86, 95, 96, 99]);

const describeWMO = (code) => WMO_DESCRIPTIONS[code] ?? "Unknown";
const isSevere = (code) => SEVERE_WMO_CODES.has(code);

/**
 * Fetch current + 5-day daily forecast for a lat/lon point.
 * Returns: { current, daily, name }
 */
const fetchPointWeather = async ({ lat, lon, name = "" }) => {
  const response = await axios.get(`${OPEN_METEO_BASE}/forecast`, {
    params: {
      latitude: lat,
      longitude: lon,
      current: [
        "temperature_2m",
        "relative_humidity_2m",
        "wind_speed_10m",
        "weather_code",
        "apparent_temperature",
      ].join(","),
      daily: [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_sum",
        "wind_speed_10m_max",
      ].join(","),
      forecast_days: 5,
      timezone: "auto",
    },
    timeout: TIMEOUT_MS,
  });

  const { current, daily } = response.data;

  return {
    name,
    current: {
      temp: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      weatherCode: current.weather_code,
      description: describeWMO(current.weather_code),
      severe: isSevere(current.weather_code),
    },
    daily: (daily.time || []).map((date, i) => ({
      date,
      weatherCode: daily.weather_code[i],
      description: describeWMO(daily.weather_code[i]),
      tempMax: Math.round(daily.temperature_2m_max[i]),
      tempMin: Math.round(daily.temperature_2m_min[i]),
      precipitation: daily.precipitation_sum[i],
      windMax: Math.round(daily.wind_speed_10m_max[i]),
      severe: isSevere(daily.weather_code[i]),
    })),
  };
};

/**
 * Aggregate weather for a set of route points (start, destination, stops).
 * Returns: { points, severeWarnings }
 */
const fetchRouteWeather = async ({ start, destination, waypoints = [], stops = [] }) => {
  const allPoints = [
    start && { ...start, role: "start" },
    ...waypoints.map((w) => ({ ...w, role: "waypoint" })),
    ...stops.map((s) => ({ lat: s.lat, lon: s.lon, name: s.name, role: "stop" })),
    destination && { ...destination, role: "destination" },
  ].filter((p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lon));

  if (!allPoints.length) {
    return { points: [], severeWarnings: [] };
  }

  const results = await Promise.allSettled(
    allPoints.map((point) => fetchPointWeather(point))
  );

  const points = results
    .map((result, i) =>
      result.status === "fulfilled"
        ? { ...result.value, role: allPoints[i].role }
        : null
    )
    .filter(Boolean);

  const severeWarnings = points
    .filter((p) => p.current?.severe)
    .map((p) => ({
      name: p.name,
      description: p.current.description,
      role: p.role,
    }));

  return { points, severeWarnings };
};

module.exports = { fetchPointWeather, fetchRouteWeather };

