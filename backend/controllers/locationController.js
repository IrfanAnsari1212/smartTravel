const { searchPlaces, reverseGeocode } = require("../services/locationService");
const { z } = require("zod");

const locationQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
});

const reverseGeocodeSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

const searchLocations = async (req, res, next) => {
  try {
    const { q = "" } = locationQuerySchema.parse(req.query);
    const results = await searchPlaces(q);
    res.json(results);
  } catch (error) {
    next(error);
  }
};

const reverseGeocodeLocation = async (req, res, next) => {
  try {
    const { lat, lon } = reverseGeocodeSchema.parse(req.query);
    const result = await reverseGeocode(lat, lon);
    res.json(result);
  } catch (error) {
    // Upstream network failure (Nominatim unreachable / DNS error)
    if (error.code === "ENOTFOUND" || error.code === "ECONNABORTED" || error.code === "ETIMEDOUT" || error.code === "ECONNRESET") {
      return res.status(503).json({ message: "Location service is temporarily unavailable. Please try again later." });
    }
    next(error);
  }
};

module.exports = {
  searchLocations,
  reverseGeocodeLocation,
};
