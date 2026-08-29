const { z } = require("zod");
const { fetchPointWeather, fetchRouteWeather } = require("../services/weatherService");

const pointSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  name: z.string().trim().max(200).optional().default(""),
  query: z.string().trim().max(200).optional().default(""),
});

const getPointWeather = async (req, res, next) => {
  try {
    const { lat, lon, name, query } = pointSchema.parse(req.query);
    const result = await fetchPointWeather({ lat, lon, name: name || query });
    res.json(result);
  } catch (error) {
    if (error.code === "ENOTFOUND" || error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return res.status(503).json({ message: "Weather service is temporarily unavailable." });
    }
    next(error);
  }
};

const getRouteWeather = async (req, res, next) => {
  try {
    const { start, destination, waypoints = [], stops = [] } = req.body;
    const result = await fetchRouteWeather({ start, destination, waypoints, stops });
    res.json(result);
  } catch (error) {
    if (error.code === "ENOTFOUND" || error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return res.status(503).json({ message: "Weather service is temporarily unavailable." });
    }
    next(error);
  }
};

module.exports = { getPointWeather, getRouteWeather };

