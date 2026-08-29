const assert = require("node:assert/strict");
const test = require("node:test");
const {
  getWeatherDetails,
  generateWeatherWarnings,
} = require("../adapters/weatherProvider");

test("getWeatherDetails maps WMO weather codes correctly", () => {
  const clear = getWeatherDetails(0);
  assert.equal(clear.condition, "clear");
  assert.equal(clear.icon, "☀️");

  const thunderstorm = getWeatherDetails(95);
  assert.equal(thunderstorm.condition, "thunderstorm");
  assert.equal(thunderstorm.icon, "⚡");

  const heavyRain = getWeatherDetails(65);
  assert.equal(heavyRain.condition, "heavy_rain");
});

test("generateWeatherWarnings detects extreme heat correctly", () => {
  const current = { temperature: 42, weatherCode: 0, windSpeed: 10 };
  const daily = { temperature_2m_max: [43, 41] };

  const warnings = generateWeatherWarnings(current, daily);
  const heatWarn = warnings.find((w) => w.type === "extreme_heat");

  assert.ok(heatWarn);
  assert.equal(heatWarn.severity, "high");
  assert.match(heatWarn.message, /43°C/);
});

test("generateWeatherWarnings detects heavy rain and thunderstorms", () => {
  const current = { temperature: 26, weatherCode: 95, windSpeed: 15 };
  const daily = {
    weather_code: [95],
    precipitation_probability_max: [85],
    precipitation_sum: [22],
  };

  const warnings = generateWeatherWarnings(current, daily);
  const stormWarn = warnings.find((w) => w.type === "thunderstorm");
  const rainWarn = warnings.find((w) => w.type === "heavy_rain");

  assert.ok(stormWarn);
  assert.ok(rainWarn);
});

test("generateWeatherWarnings flags high wind gusts", () => {
  const current = { temperature: 20, weatherCode: 2, windSpeed: 52 };
  const warnings = generateWeatherWarnings(current, {});
  const windWarn = warnings.find((w) => w.type === "high_wind");

  assert.ok(windWarn);
  assert.equal(windWarn.severity, "high");
});

