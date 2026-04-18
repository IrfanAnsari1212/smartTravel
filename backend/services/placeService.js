const axios = require("axios");

const DEFAULT_TYPES = ["restaurant", "hotel", "fuel"];

const overpassFragments = {
  restaurant: 'node["amenity"="restaurant"]',
  hotel: 'node["tourism"="hotel"]',
  fuel: 'node["amenity"="fuel"]',
};

const getPlaceCategory = (tags = {}) => {
  if (tags.amenity === "restaurant") {
    return "restaurant";
  }

  if (tags.tourism === "hotel") {
    return "hotel";
  }

  if (tags.amenity === "fuel") {
    return "fuel";
  }

  return "place";
};

const formatPlace = (place) => ({
  id: String(place.id),
  name: place.tags?.name || "Unnamed Place",
  category: getPlaceCategory(place.tags),
  lat: Number(place.lat),
  lon: Number(place.lon),
  address: [
    place.tags?.["addr:street"],
    place.tags?.["addr:city"],
    place.tags?.["addr:state"],
  ]
    .filter(Boolean)
    .join(", "),
});

const getPlacesNearby = async (lat, lon, placeTypes = DEFAULT_TYPES) => {
  try {
    const url = "https://overpass-api.de/api/interpreter";
    const selectedTypes = placeTypes.filter((type) => overpassFragments[type]);

    const queryParts = (selectedTypes.length ? selectedTypes : DEFAULT_TYPES).map(
      (type) => `${overpassFragments[type]}(around:5000,${lat},${lon});`
    );

    const query = `
      [out:json][timeout:10];
      (
        ${queryParts.join("\n")}
      );
      out;
    `;

    const response = await axios.post(url, query, {
      timeout: 8000,
    });

    const deduped = new Map();

    response.data.elements.forEach((place) => {
      const formatted = formatPlace(place);

      if (!deduped.has(formatted.id)) {
        deduped.set(formatted.id, formatted);
      }
    });

    return Array.from(deduped.values());
  } catch (error) {
    console.log(`Places API failed for [${lat}, ${lon}]:`, error.message);
    return [];
  }
};

module.exports = { getPlacesNearby };
