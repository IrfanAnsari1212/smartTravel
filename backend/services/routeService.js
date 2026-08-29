const { queryOsrmRoute } = require("../adapters/osrmAdapter");
const { routeCache } = require("./cacheService");

const getRoute = async (startOrPoints, destination) => {
  let points = [];
  if (Array.isArray(startOrPoints)) {
    points = startOrPoints;
  } else if (startOrPoints && destination) {
    points = [startOrPoints, destination];
  } else {
    throw new Error("Invalid route points provided.");
  }

  const cacheKey = points
    .map((p) => `${Number(p.lon).toFixed(4)},${Number(p.lat).toFixed(4)}`)
    .join("->");

  const cached = routeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const route = await queryOsrmRoute(points);
  routeCache.set(cacheKey, route);
  return route;
};

module.exports = { getRoute };
