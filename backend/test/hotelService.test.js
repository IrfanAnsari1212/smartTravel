const assert = require("node:assert/strict");
const test = require("node:test");
const { extractAmenities, formatHotel } = require("../adapters/hotelProvider");

test("hotelProvider extracts verified amenities correctly", () => {
  const tags = {
    name: "Grand Palace Hotel",
    wifi: "yes",
    swimming_pool: "yes",
    parking: "yes",
    air_conditioning: "yes",
    cuisine: "Indian",
    stars: "5",
  };

  const amenities = extractAmenities(tags);
  assert.ok(amenities.includes("Free WiFi"));
  assert.ok(amenities.includes("Swimming Pool"));
  assert.ok(amenities.includes("Parking"));
  assert.ok(amenities.includes("Air Conditioning"));
  assert.ok(amenities.includes("Restaurant (Indian)"));
});

test("formatHotel builds normalized hotel object with direct booking links", () => {
  const element = {
    id: 1234567,
    lat: 27.175,
    lon: 78.0422,
    tags: {
      name: "Taj View Resort",
      brand: "Taj",
      stars: "5",
      tourism: "resort",
      "addr:city": "Agra",
      "addr:street": "Fatehabad Road",
      phone: "+91 562 222 3333",
    },
  };

  const formatted = formatHotel(element, { lat: 27.17, lon: 78.04 }, "2026-09-01", "2026-09-05", 2, 1);

  assert.equal(formatted.id, "hotel-1234567");
  assert.equal(formatted.name, "Taj View Resort");
  assert.equal(formatted.stars, 5);
  assert.equal(formatted.type, "resort");
  assert.equal(formatted.address, "Fatehabad Road, Agra");
  assert.ok(formatted.directBookingUrl.includes("google.com/travel/hotels"));
  assert.equal(formatted.inventoryStatus.isLiveVerified, true);
  assert.equal(formatted.inventoryStatus.requiresLiveCheck, true);
});

