const buildTripContextSummary = (tripContext = {}) => {
  const {
    start,
    destination,
    distance,
    duration,
    places = [],
    waypoints = [],
    weatherAlerts = [],
    emergencyServices = {},
    preferences = {},
  } = tripContext;

  const startName = start?.name || "Starting Point";
  const destName = destination?.name || "Destination";
  const distanceKm = distance ? (distance / 1000).toFixed(1) : "Unknown";
  const durationHrs = duration ? (duration / 3600).toFixed(1) : "Unknown";

  const categorizedPlaces = {
    attraction: places.filter((p) => p.category === "attraction"),
    restaurant: places.filter((p) => p.category === "restaurant"),
    hotel: places.filter((p) => p.category === "hotel"),
    fuel: places.filter((p) => p.category === "fuel"),
    hospital: places.filter((p) => p.category === "hospital"),
    police: places.filter((p) => p.category === "police"),
    mechanic: places.filter((p) => p.category === "mechanic"),
    pharmacy: places.filter((p) => p.category === "pharmacy"),
    atm: places.filter((p) => p.category === "atm"),
    parking: places.filter((p) => p.category === "parking"),
  };

  const formatPlaceList = (list) =>
    list.length
      ? list
          .slice(0, 8)
          .map(
            (p) =>
              `- [${p.category.toUpperCase()}] "${p.name}" (ID: ${p.id})${
                p.cuisine ? ` | Cuisine: ${p.cuisine}` : ""
              }${p.brand ? ` | Brand: ${p.brand}` : ""}${
                p.openingHours ? ` | Hours: ${p.openingHours}` : ""
              }${p.address ? ` | Address: ${p.address}` : ""}${
                p.highlights?.length ? ` | Features: ${p.highlights.join(", ")}` : ""
              }`
          )
          .join("\n")
      : "None discovered along this segment.";

  const weatherSummary = weatherAlerts.length
    ? weatherAlerts
        .map((w) => `- ⚠️ ${w.title || w.type}: ${w.message} (Severity: ${w.severity})`)
        .join("\n")
    : "No severe weather alerts active.";

  const waypointsSummary = waypoints.length
    ? waypoints.map((wp, i) => `Stop ${i + 1}: ${wp.name || wp}`).join(" -> ")
    : "Direct corridor without planned intermediate stops.";

  return `
TRIP OVERVIEW:
- Origin: ${startName}
- Destination: ${destName}
- Intermediate Waypoints: ${waypointsSummary}
- Driving Distance: ${distanceKm} km
- Driving Duration: ${durationHrs} hours
- Preferences: Avoid Tolls=${Boolean(preferences.avoidTolls)}, Avoid Highways=${Boolean(preferences.avoidHighways)}

ACTIVE METEOROLOGICAL FORECAST & ALERTS:
${weatherSummary}

VERIFIED REAL PLACES FOUND ALONG ROUTE & DESTINATION (From OpenStreetMap):
[Tourist Attractions & Sights]:
${formatPlaceList(categorizedPlaces.attraction)}

[Restaurants & Cafes]:
${formatPlaceList(categorizedPlaces.restaurant)}

[Hotels & Lodging]:
${formatPlaceList(categorizedPlaces.hotel)}

[Fuel & EV Stations]:
${formatPlaceList(categorizedPlaces.fuel)}

[Medical & Hospitals]:
${formatPlaceList(categorizedPlaces.hospital)}

[Police & Emergency]:
${formatPlaceList(categorizedPlaces.police)}

[Car Repair & Mechanics]:
${formatPlaceList(categorizedPlaces.mechanic)}
`;
};

const SYSTEM_INSTRUCTIONS = `
You are the SmartTravel AI Assistant — an intelligent, friendly, and highly knowledgeable road trip and destination travel guide.

CRITICAL GROUNDING & NO FAKE DATA RULES:
1. Strictly ground all place recommendations on the VERIFIED REAL PLACES and WEATHER provided in the context.
2. DO NOT hallucinate fake attractions, hotels, restaurants, phone numbers, opening hours, or addresses.
3. If the user asks for recommendations, refer specifically to the verified places in the list by their exact names.
4. If no places of a requested type are in the verified list, acknowledge this honestly and offer practical guidance based on the route distance and estimated driving duration.
5. When outputting structured recommendations, provide valid JSON matching the requested schema.
6. When recommending stops, explain WHY each stop is suitable (e.g. scenic value, food specialty, convenient rest stop, 24/7 access).
`;

module.exports = {
  buildTripContextSummary,
  SYSTEM_INSTRUCTIONS,
};
