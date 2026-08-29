const { z } = require("zod");
const { getPointWeather, getRouteWeatherForecast } = require("../services/weatherService");

const pointWeatherSchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lon: z.coerce.number().min(-180).max(180).optional(),
  name: z.string().trim().optional(),
  query: z.string().trim().optional(),
});

const routeWeatherSchema = z.object({
  start: z.object({ lat: z.number(), lon: z.number(), name: z.string().optional() }).optional(),
  destination: z.object({ lat: z.number(), lon: z.number(), name: z.string().optional() }).optional(),
  waypoints: z.array(z.object({ lat: z.number(), lon: z.number(), name: z.string().optional() })).optional().default([]),
  stops: z.array(z.object({ lat: z.number(), lon: z.number(), name: z.string().optional() })).optional().default([]),
});

const getPointWeatherController = async (req, res, next) => {
  try {
    const params = pointWeatherSchema.parse({
      ...req.query,
      ...req.body,
    });

    const weather = await getPointWeather(params);
    res.json(weather);
  } catch (error) {
    next(error);
  }
};

const getRouteWeatherController = async (req, res, next) => {
  try {
    const payload = routeWeatherSchema.parse(req.body);
    const forecast = await getRouteWeatherForecast(payload);
    res.json(forecast);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPointWeatherController,
  getRouteWeatherController,
};
