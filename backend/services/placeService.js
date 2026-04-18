const axios = require("axios");

const getPlacesNearby = async (lat, lon) => {
  try {
    const url = `https://overpass-api.de/api/interpreter`;

    const query = `
    [out:json][timeout:10];
    (
      node["amenity"="restaurant"](around:5000,${lat},${lon});
      node["tourism"="hotel"](around:5000,${lat},${lon});
      node["amenity"="fuel"](around:5000,${lat},${lon});
    );
    out;
    `;

    const response = await axios.post(url, query, {
      timeout: 8000
    });

    console.log("✅ Places fetched:", response.data.elements.length);

    return response.data.elements;

  } catch (error) {
    console.log(`⚠️ Places API failed for [${lat}, ${lon}]:`, error.message);

    return []; // VERY IMPORTANT
  }
};

module.exports = { getPlacesNearby };