const { searchPlaces } = require("../services/locationService");
const { z } = require("zod");

const locationQuerySchema = z.object({ q: z.string().trim().max(200).optional() });

const searchLocations = async (req, res, next) => {
  try {
    const { q = "" } = locationQuerySchema.parse(req.query);
    const results = await searchPlaces(q);
    res.json(results);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchLocations,
};
