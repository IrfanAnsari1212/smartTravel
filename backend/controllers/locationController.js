const { searchPlaces } = require("../services/locationService");

const searchLocations = async (req, res, next) => {
  try {
    const results = await searchPlaces(req.query.q);
    res.json(results);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchLocations,
};
