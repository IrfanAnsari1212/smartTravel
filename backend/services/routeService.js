const axios = require("axios");

const getRoute = async (start, destination) => {
  const url = `https://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${destination.lon},${destination.lat}?overview=full&geometries=geojson`;
  const response = await axios.get(url, {
    timeout: 8000,
  });
  const route = response.data?.routes?.[0];

  if (!route?.geometry?.coordinates?.length) {
    const error = new Error(
      `No drivable route found between "${start.name}" and "${destination.name}".`
    );
    error.statusCode = 404;
    throw error;
  }

  return route;
};

module.exports = { getRoute };
