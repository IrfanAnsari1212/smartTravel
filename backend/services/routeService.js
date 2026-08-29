const { queryOsrmRoute } = require("../adapters/osrmAdapter");
const { routeCache } = require("./cacheService");

const getRoute = async (start, destination) => {
  const cacheKey = `${Number(start.lon).toFixed(4)},${Number(start.lat).toFixed(4)}->${Number(destination.lon).toFixed(4)},${Number(destination.lat).toFixed(4)}`;
  const cached = routeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const route = await queryOsrmRoute(start, destination);
  routeCache.set(cacheKey, route);
  return route;
};

module.exports = { getRoute };
