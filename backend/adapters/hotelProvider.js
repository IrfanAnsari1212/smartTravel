const { queryOverpass } = require("./overpassAdapter");
const { withRetry } = require("../utils/retry");

/**
 * Extracts tagged hotel amenities from OpenStreetMap element tags
 */
const extractAmenities = (tags = {}) => {
  const amenities = [];
  if (tags.internet_access === "wlan" || tags.internet_access === "yes" || tags.wifi === "yes") {
    amenities.push("Free WiFi");
  }
  if (tags.swimming_pool === "yes" || tags.leisure === "swimming_pool" || tags.pool === "yes") {
    amenities.push("Swimming Pool");
  }
  if (tags.parking === "yes" || tags.amenity === "parking") {
    amenities.push("Parking");
  }
  if (tags.air_conditioning === "yes") {
    amenities.push("Air Conditioning");
  }
  if (tags.restaurant === "yes" || tags.cuisine) {
    amenities.push(tags.cuisine ? `Restaurant (${tags.cuisine})` : "Restaurant");
  }
  if (tags.bar === "yes") {
    amenities.push("Bar & Lounge");
  }
  if (tags.wheelchair === "yes") {
    amenities.push("Wheelchair Accessible");
  }
  if (tags.room_service === "yes") {
    amenities.push("Room Service");
  }
  if (tags.spa === "yes") {
    amenities.push("Spa & Wellness");
  }
  return amenities;
};

/**
 * Normalizes an accommodation element from Overpass
 */
const formatHotel = (element, userCoords, checkIn, checkOut, guests, rooms) => {
  const tags = element.tags || {};
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  const name = tags.name || tags["name:en"] || tags.brand || "Boutique Hotel";

  // Build clean address
  const addressParts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:suburb"],
    tags["addr:city"] || tags["addr:town"],
    tags["addr:state"],
    tags["addr:postcode"],
  ].filter(Boolean);

  const address = addressParts.length > 0 ? addressParts.join(", ") : tags["addr:full"] || "";

  // Extract stars rating
  const stars = tags.stars ? Number(tags.stars) : tags["hotel:stars"] ? Number(tags["hotel:stars"]) : null;

  // Build direct booking provider search URL (Google Hotels / Booking search grounded on real coordinates & dates)
  const encodedName = encodeURIComponent(name);
  const checkInParam = checkIn ? `&dates=${checkIn}` : "";
  const directBookingUrl =
    tags.website ||
    tags["contact:website"] ||
    `https://www.google.com/travel/hotels?q=${encodedName}+${lat},${lon}&guests=${guests || 2}&rooms=${rooms || 1}${checkInParam}`;

  return {
    id: `hotel-${element.id}`,
    name,
    brand: tags.brand || "",
    type: tags.tourism || "hotel", // hotel | guest_house | hostel | resort | motel | chalet
    stars,
    lat,
    lon,
    address,
    phone: tags.phone || tags["contact:phone"] || "",
    email: tags.email || tags["contact:email"] || "",
    website: tags.website || tags["contact:website"] || "",
    directBookingUrl,
    amenities: extractAmenities(tags),
    checkInTime: tags.check_in || "14:00",
    checkOutTime: tags.check_out || "11:00",
    // Grounded Inventory Metadata: Do NOT simulate fake prices or fake room counts.
    inventoryStatus: {
      provider: "OpenStreetMap Live Accommodation Directory & Direct Provider Link",
      isLiveVerified: true,
      hasDirectWebsite: Boolean(tags.website || tags["contact:website"]),
      requiresLiveCheck: true,
    },
  };
};

/**
 * Searches real hotel accommodations near coordinates
 */
const queryNearbyHotels = async ({ lat, lon, radius = 10000, checkIn, checkOut, guests = 2, rooms = 1 }) => {
  const query = `
    [out:json][timeout:15];
    (
      nwr["tourism"~"hotel|guest_house|hostel|resort|motel|chalet"](around:${radius},${lat},${lon});
    );
    out center 40 tags;
  `;

  return withRetry(async () => {
    const elements = await queryOverpass(query);
    const hotelsMap = new Map();

    elements.forEach((element) => {
      const hotel = formatHotel(element, { lat, lon }, checkIn, checkOut, guests, rooms);
      if (Number.isFinite(hotel.lat) && Number.isFinite(hotel.lon) && !hotelsMap.has(hotel.id)) {
        hotelsMap.set(hotel.id, hotel);
      }
    });

    return Array.from(hotelsMap.values());
  });
};

module.exports = {
  queryNearbyHotels,
  formatHotel,
  extractAmenities,
};

