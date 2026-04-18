const { getCoordinates } = require("../services/locationService");
const { getRoute } = require("../services/routeService");
const { getPlacesNearby } = require("../services/placeService");

const planTrip = async (req, res, next) => {
  try {
    const { start, destination } = req.body;

    if (!start || !destination) {
      return res
        .status(400)
        .json({ message: "Start and destination are required" });
    }

    // Step 1: Geocoding
    const startCoords = await getCoordinates(start);
    const destCoords = await getCoordinates(destination);

    // Step 2: Route Fetching
    const route = await getRoute(startCoords, destCoords);
    const coordinates = route.geometry.coordinates;

    // Step 3: Get Middle Point of Route
    // Logic: coordinates is usually [[lon, lat], [lon, lat], ...]
    const points = [
      coordinates[0], // start
      coordinates[Math.floor(coordinates.length / 2)], // mid
      coordinates[coordinates.length - 1], // end
    ];
    const [lon, lat] = points[1];

    console.log(`📍 Midpoint identified at: ${lat}, ${lon}`);

    // Step 4: Fetch Nearby Places (Midpoint Only)
    let places = [];

    for (let point of points) {
      const [lon, lat] = point;

      try {
        const nearby = await getPlacesNearby(lat, lon);
        places.push(...nearby);
      } catch (err) {
        console.log("⚠️ Skipping one point");
      }
    }

    // ✅ LIMIT RESULTS HERE
    places = places.slice(0, 10);

    // Step 5: Final Response
    res.json({
      distance: route.distance,
      duration: route.duration,
      geometry: route.geometry,
      places: places,
    });
  } catch (error) {
    console.error("❌ Trip Error:", error.response?.data || error.message);
    next(error);
  }
};

module.exports = { planTrip };
