const axios = require("axios");

const getRoute = async (start, destination) => {

  const url = `https://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${destination.lon},${destination.lat}?overview=full&geometries=geojson`;

  const response = await axios.get(url);

  return response.data.routes[0];

};

module.exports = { getRoute };