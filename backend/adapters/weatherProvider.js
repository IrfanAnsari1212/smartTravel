const axios = require("axios");
const { withRetry } = require("../utils/retry");

/**
 * WMO Weather interpretation codes (WMO Code Table 4677)
 */
const WMO_WEATHER_MAP = {
  0: { description: "Clear sky", icon: "☀️", condition: "clear" },
  1: { description: "Mainly clear", icon: "🌤️", condition: "clear" },
  2: { description: "Partly cloudy", icon: "⛅", condition: "cloudy" },
  3: { description: "Overcast", icon: "☁️", condition: "overcast" },
  45: { description: "Fog", icon: "🌫️", condition: "fog" },
  48: { description: "Depositing rime fog", icon: "🌫️", condition: "fog" },
  51: { description: "Light drizzle", icon: "🌦️", condition: "drizzle" },
  53: { description: "Moderate drizzle", icon: "🌦️", condition: "drizzle" },
  55: { description: "Dense drizzle", icon: "🌧️", condition: "drizzle" },
  61: { description: "Slight rain", icon: "🌦️", condition: "rain" },
  63: { description: "Moderate rain", icon: "🌧️", condition: "rain" },
  65: { description: "Heavy rain", icon: "🌧️", condition: "heavy_rain" },
  71: { description: "Slight snow fall", icon: "🌨️", condition: "snow" },
  73: { description: "Moderate snow fall", icon: "🌨️", condition: "snow" },
  75: { description: "Heavy snow fall", icon: "❄️", condition: "heavy_snow" },
  80: { description: "Slight rain showers", icon: "🌦️", condition: "rain" },
  81: { description: "Moderate rain showers", icon: "🌧️", condition: "rain" },
  82: { description: "Violent rain showers", icon: "⛈️", condition: "heavy_rain" },
  95: { description: "Thunderstorm", icon: "⚡", condition: "thunderstorm" },
  96: { description: "Thunderstorm with slight hail", icon: "⛈️", condition: "thunderstorm" },
  99: { description: "Thunderstorm with heavy hail", icon: "⛈️", condition: "thunderstorm" },
};

const getWeatherDetails = (code = 0) => {
  return WMO_WEATHER_MAP[code] || { description: "Clear", icon: "☀️", condition: "clear" };
};

/**
 * Deterministically generates severe weather safety warnings
 */
const generateWeatherWarnings = (current, daily = {}) => {
  const warnings = [];

  // 1. Extreme Heat Warning
  const maxTemp = Math.max(current.temperature, ...(daily.temperature_2m_max || []));
  if (maxTemp >= 40) {
    warnings.push({
      type: "extreme_heat",
      severity: "high",
      icon: "🔥",
      title: "Extreme Heat Warning",
      message: `Temperatures reaching ${Math.round(maxTemp)}°C. Stay hydrated, keep vehicle AC running, and avoid direct midday sun.`,
    });
  } else if (maxTemp >= 36) {
    warnings.push({
      type: "heat_alert",
      severity: "moderate",
      icon: "🌡️",
      title: "High Heat Alert",
      message: `Temperatures up to ${Math.round(maxTemp)}°C expected. Carry water and plan shaded stops.`,
    });
  }

  // 2. Heavy Rain Warning
  const precipitationProb = current.precipitationProbability ?? (daily.precipitation_probability_max?.[0] || 0);
  const rainAmount = daily.precipitation_sum?.[0] || 0;
  const isHeavyRainCode = [65, 82].includes(current.weatherCode);

  if (isHeavyRainCode || precipitationProb >= 75 || rainAmount >= 15) {
    warnings.push({
      type: "heavy_rain",
      severity: "high",
      icon: "🌧️",
      title: "Heavy Rain Expected",
      message: `High chance of heavy rain (${precipitationProb}% probability, ${rainAmount}mm). Reduce highway driving speeds and check tire traction.`,
    });
  } else if (precipitationProb >= 50 || rainAmount >= 5) {
    warnings.push({
      type: "rain_expected",
      severity: "moderate",
      icon: "🌦️",
      title: "Rain Expected",
      message: `Rain showers likely (${precipitationProb}% chance). Keep umbrellas handy.`,
    });
  }

  // 3. Thunderstorm Warning
  const isThunderstorm = [95, 96, 99].includes(current.weatherCode) || (daily.weather_code || []).some((c) => [95, 96, 99].includes(c));
  if (isThunderstorm) {
    warnings.push({
      type: "thunderstorm",
      severity: "high",
      icon: "⚡",
      title: "Thunderstorm Possible",
      message: "Thunderstorms with lightning and strong sudden wind gusts expected. Avoid parking under large trees or weak structures.",
    });
  }

  // 4. High Wind Warning
  if (current.windSpeed >= 45) {
    warnings.push({
      type: "high_wind",
      severity: "high",
      icon: "💨",
      title: "High Wind Alert",
      message: `Strong wind gusts up to ${Math.round(current.windSpeed)} km/h. Maintain firm two-handed grip on the steering wheel.`,
    });
  }

  // 5. Dense Fog / Low Visibility Warning
  if ([45, 48].includes(current.weatherCode)) {
    warnings.push({
      type: "fog_warning",
      severity: "high",
      icon: "🌫️",
      title: "Dense Fog Alert",
      message: "Low visibility and dense fog conditions. Use low beam/fog lights and increase following distance.",
    });
  }

  // 6. Freezing / Cold Warning
  const minTemp = Math.min(current.temperature, ...(daily.temperature_2m_min || []));
  if (minTemp <= 4) {
    warnings.push({
      type: "cold_warning",
      severity: "moderate",
      icon: "❄️",
      title: "Cold Weather Alert",
      message: `Low temperatures dropping to ${Math.round(minTemp)}°C. Pack warm thermal layers.`,
    });
  }

  return warnings;
};

/**
 * Fetches real weather forecast from Open-Meteo API
 */
const fetchWeatherFromProvider = async (lat, lon, days = 5) => {
  const url = "https://api.open-meteo.com/v1/forecast";
  const params = {
    latitude: lat,
    longitude: lon,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,uv_index_max",
    forecast_days: Math.min(Math.max(1, days), 7),
    timezone: "auto",
  };

  return withRetry(
    async () => {
      const response = await axios.get(url, { params, timeout: 8000 });
      const data = response.data;

      const currentRaw = data.current || {};
      const currentCode = currentRaw.weather_code || 0;
      const currentDetails = getWeatherDetails(currentCode);

      const current = {
        temperature: Math.round(currentRaw.temperature_2m ?? 24),
        apparentTemperature: Math.round(currentRaw.apparent_temperature ?? 24),
        humidity: currentRaw.relative_humidity_2m ?? 50,
        windSpeed: Math.round(currentRaw.wind_speed_10m ?? 10),
        precipitation: currentRaw.precipitation ?? 0,
        weatherCode: currentCode,
        description: currentDetails.description,
        icon: currentDetails.icon,
        condition: currentDetails.condition,
        time: currentRaw.time || new Date().toISOString(),
      };

      const dailyRaw = data.daily || {};
      const dailyDates = dailyRaw.time || [];
      const dailyForecast = dailyDates.map((date, idx) => {
        const code = dailyRaw.weather_code?.[idx] || 0;
        const details = getWeatherDetails(code);
        return {
          date,
          weatherCode: code,
          description: details.description,
          icon: details.icon,
          condition: details.condition,
          maxTemp: Math.round(dailyRaw.temperature_2m_max?.[idx] ?? current.temperature),
          minTemp: Math.round(dailyRaw.temperature_2m_min?.[idx] ?? current.temperature),
          precipitationSum: dailyRaw.precipitation_sum?.[idx] ?? 0,
          precipitationProbability: dailyRaw.precipitation_probability_max?.[idx] ?? 0,
          uvIndex: dailyRaw.uv_index_max?.[idx] ?? 5,
        };
      });

      const warnings = generateWeatherWarnings(current, dailyRaw);

      return {
        lat,
        lon,
        current,
        daily: dailyForecast,
        warnings,
        provider: "Open-Meteo Global Forecasting API",
      };
    },
    { maxRetries: 2, initialDelayMs: 300 }
  );
};

module.exports = {
  fetchWeatherFromProvider,
  getWeatherDetails,
  generateWeatherWarnings,
};

