const { queryOverpass } = require("../adapters/overpassAdapter");
const { placesCache } = require("./cacheService");

const DEFAULT_TYPES = [
  "restaurant",
  "hotel",
  "fuel",
  "attraction",
  "hospital",
  "police",
  "mechanic",
  "pharmacy",
  "atm",
  "parking",
];

const ALL_TYPES = [
  "restaurant",
  "hotel",
  "fuel",
  "attraction",
  "hospital",
  "police",
  "mechanic",
  "pharmacy",
  "atm",
  "parking",
];

const overpassFragments = {
  restaurant: 'nwr["amenity"~"restaurant|cafe|fast_food|food_court"]',
  hotel: 'nwr["tourism"~"hotel|guest_house|hostel|motel|resort|chalet"]',
  fuel: 'nwr["amenity"="fuel"]',
  attraction:
    'nwr["tourism"~"attraction|viewpoint|museum|theme_park|zoo|aquarium|gallery"]; nwr["historic"~"monument|memorial|castle|fort|ruins|archaeological_site"]; nwr["natural"~"beach|waterfall|peak|cave_entrance"]; nwr["leisure"~"park|nature_reserve|water_park"]',
  hospital: 'nwr["amenity"~"hospital|clinic"]',
  police: 'nwr["amenity"="police"]',
  mechanic: 'nwr["shop"="car_repair"]',
  pharmacy: 'nwr["amenity"="pharmacy"]',
  atm: 'nwr["amenity"~"atm|bank"]',
  parking: 'nwr["amenity"="parking"]',
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

  if (tags.fee === "no" || tags.charge === "no") {
    highlights.push("Free entry");
  }

  if (tags.tourism === "viewpoint") {
    highlights.push("Scenic Viewpoint");
  }

  if (tags.historic) {
    highlights.push("Historic Landmark");
  }

  if (tags.outdoor_seating === "yes") {
    highlights.push("Outdoor seating");
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
  if (
    tags.tourism === "attraction" ||
    tags.tourism === "viewpoint" ||
    tags.tourism === "museum" ||
    tags.tourism === "theme_park" ||
    tags.historic ||
    tags.natural === "beach" ||
    tags.natural === "waterfall" ||
    tags.natural === "peak" ||
    tags.natural === "cave_entrance" ||
    tags.leisure === "park" ||
    tags.leisure === "nature_reserve"
  ) {
    return "attraction";
  }

  if (
    tags.amenity === "restaurant" ||
    tags.amenity === "cafe" ||
    tags.amenity === "fast_food" ||
    tags.amenity === "food_court"
  ) {
    return "restaurant";
  }

  if (
    tags.tourism === "hotel" ||
    tags.tourism === "guest_house" ||
    tags.tourism === "hostel" ||
    tags.tourism === "motel" ||
    tags.tourism === "resort"
  ) {
    return "hotel";
  }

  if (tags.amenity === "fuel") {
    return "fuel";
  }

  if (tags.amenity === "hospital" || tags.amenity === "clinic") {
    return "hospital";
  }

  if (tags.amenity === "police") {
    return "police";
  }

  if (tags.shop === "car_repair") {
    return "mechanic";
  }

  if (tags.amenity === "pharmacy") {
    return "pharmacy";
  }

  if (tags.amenity === "atm" || tags.amenity === "bank") {
    return "atm";
  }

  if (tags.amenity === "parking") {
    return "parking";
  }

  return "place";
};

const formatPlace = (place) => ({
  id: String(place.id),
  name: place.tags?.name || place.tags?.["name:en"] || "Unnamed Location",
  category: getPlaceCategory(place.tags),
  lat: Number(place.lat ?? place.center?.lat),
  lon: Number(place.lon ?? place.center?.lon),
  address: [
    place.tags?.["addr:housenumber"],
    place.tags?.["addr:street"],
    place.tags?.["addr:suburb"],
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

const getPlacesNearby = async (lat, lon, placeTypes = DEFAULT_TYPES, radius = 5000) => {
  const selectedTypes = placeTypes.filter((type) => overpassFragments[type]);
  const typesList = selectedTypes.length ? selectedTypes : DEFAULT_TYPES;

  // In-memory caching for coordinate + types
  const cacheKey = `geo:${Number(lat).toFixed(3)},${Number(lon).toFixed(3)}:${typesList.sort().join(",")}:${radius}`;
  const cached = placesCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const queryParts = typesList.map((type) => {
    const fragment = overpassFragments[type];
    // Some types have multiple statements separated by ';'
    return fragment
      .split(";")
      .map((sub) => sub.trim())
      .filter(Boolean)
      .map((sub) => `${sub}(around:${radius},${lat},${lon});`)
      .join("\n");
  });

  const query = `
    [out:json][timeout:15];
    (
      ${queryParts.join("\n")}
    );
    out center 35 tags;
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

  const results = Array.from(deduped.values());
  placesCache.set(cacheKey, results);
  return results;
};

module.exports = { ALL_TYPES, DEFAULT_TYPES, getPlacesNearby, formatPlace, getPlaceCategory };
