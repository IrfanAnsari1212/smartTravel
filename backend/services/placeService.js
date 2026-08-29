const { queryOverpass } = require("../adapters/overpassAdapter");

const DEFAULT_TYPES = ["restaurant", "hotel", "fuel"];
const ALL_TYPES = ["restaurant", "hotel", "fuel", "hospital", "mechanic"];

const overpassFragments = {
  restaurant: 'nwr["amenity"="restaurant"]',
  hotel: 'nwr["tourism"="hotel"]',
  fuel: 'nwr["amenity"="fuel"]',
  hospital: 'nwr["amenity"="hospital"]',
  mechanic: 'nwr["shop"="car_repair"]',
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

  if (tags.amenity === "hospital") {
    return "hospital";
  }

  if (tags.shop === "car_repair") {
    return "mechanic";
  }

  return "place";
};

const formatPlace = (place) => ({
  id: String(place.id),
  name: place.tags?.name || "Unnamed Place",
  category: getPlaceCategory(place.tags),
  lat: Number(place.lat ?? place.center?.lat),
  lon: Number(place.lon ?? place.center?.lon),
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
  const selectedTypes = placeTypes.filter((type) => overpassFragments[type]);

  const queryParts = (selectedTypes.length ? selectedTypes : DEFAULT_TYPES).map(
    (type) => `${overpassFragments[type]}(around:5000,${lat},${lon});`
  );

  const query = `
    [out:json][timeout:10];
    (
      ${queryParts.join("\n")}
    );
    out center tags;
  `;

  const elements = await queryOverpass(query);
  const deduped = new Map();

  elements.forEach((place) => {
    const formatted = formatPlace(place);

    if (
      Number.isFinite(formatted.lat) &&
      Number.isFinite(formatted.lon) &&
      !deduped.has(formatted.id)
    ) {
      deduped.set(formatted.id, formatted);
    }
  });

  return Array.from(deduped.values());
};

module.exports = { ALL_TYPES, getPlacesNearby, formatPlace };
