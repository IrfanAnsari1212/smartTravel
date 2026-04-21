const axios = require("axios");

const DEFAULT_TYPES = ["restaurant", "hotel", "fuel"];

const overpassFragments = {
  restaurant: 'node["amenity"="restaurant"]',
  hotel: 'node["tourism"="hotel"]',
  fuel: 'node["amenity"="fuel"]',
};

const formatTagValue = (value) =>
  value
    ?.split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .join(", ") || "";

const buildHighlights = (tags = {}) => {
  const highlights = [];

  if (tags.opening_hours === "24/7") {
    highlights.push("Open 24/7");
  }

  if (tags.toilets === "yes") {
    highlights.push("Restrooms");
  }

  if (tags.wheelchair === "yes") {
    highlights.push("Wheelchair access");
  }

  if (tags.takeaway === "yes") {
    highlights.push("Takeaway");
  }

  if (tags.internet_access === "wlan" || tags.internet_access === "yes") {
    highlights.push("Wi-Fi");
  }

  if (tags["payment:cards"] === "yes" || tags["payment:credit_cards"] === "yes") {
    highlights.push("Cards accepted");
  }

  return highlights.slice(0, 4);
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
    place.tags?.["addr:housenumber"],
    place.tags?.["addr:street"],
    place.tags?.["addr:city"],
    place.tags?.["addr:state"],
  ]
    .filter(Boolean)
    .join(", "),
  brand: place.tags?.brand || "",
  cuisine: formatTagValue(place.tags?.cuisine),
  openingHours: place.tags?.opening_hours || "",
  phone: place.tags?.phone || place.tags?.["contact:phone"] || "",
  website: place.tags?.website || place.tags?.["contact:website"] || "",
  highlights: buildHighlights(place.tags),
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
