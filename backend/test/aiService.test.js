const assert = require("node:assert/strict");
const test = require("node:test");
const { buildTripContextSummary } = require("../services/aiContextBuilder");
const { generateIntelligentFallbackReply } = require("../adapters/aiAdapter");

test("buildTripContextSummary creates a structured overview of route and places", () => {
  const tripContext = {
    start: { name: "Delhi" },
    destination: { name: "Agra" },
    distance: 200000,
    duration: 7200,
    places: [
      { id: "p1", name: "Taj Mahal", category: "attraction", highlights: ["Historic Landmark"] },
      { id: "p2", name: "Highway Cafe", category: "restaurant", cuisine: "Indian" },
      { id: "p3", name: "Grand Hotel", category: "hotel" },
    ],
  };

  const summary = buildTripContextSummary(tripContext);
  assert.match(summary, /Origin: Delhi/);
  assert.match(summary, /Destination: Agra/);
  assert.match(summary, /Taj Mahal/);
  assert.match(summary, /Highway Cafe/);
  assert.match(summary, /Grand Hotel/);
});

test("generateIntelligentFallbackReply grounds answers on real attractions and provides tips", () => {
  const tripContext = {
    start: { name: "Delhi" },
    destination: { name: "Agra" },
    distance: 200000,
    duration: 7200,
    places: [
      { id: "p1", name: "Taj Mahal", category: "attraction" },
      { id: "p2", name: "Agra Fort", category: "attraction" },
    ],
  };

  const response = generateIntelligentFallbackReply({
    message: "What attractions should I visit in Agra?",
    tripContext,
  });

  assert.match(response.reply, /Taj Mahal/);
  assert.match(response.reply, /Agra Fort/);
  assert.equal(response.recommendedPlaces.length, 2);
  assert.equal(response.recommendedPlaces[0].name, "Taj Mahal");
});

test("generateIntelligentFallbackReply provides dining advice for food queries", () => {
  const tripContext = {
    start: { name: "Delhi" },
    destination: { name: "Jaipur" },
    distance: 260000,
    duration: 18000,
    places: [
      { id: "p1", name: "Haldiram Highway", category: "restaurant", cuisine: "North Indian" },
    ],
  };

  const response = generateIntelligentFallbackReply({
    message: "Where can I stop for food?",
    tripContext,
  });

  assert.match(response.reply, /Haldiram Highway/);
  assert.equal(response.recommendedPlaces.length, 1);
});

test("generateIntelligentFallbackReply drafts a multi-part schedule for itinerary queries", () => {
  const tripContext = {
    start: { name: "Delhi" },
    destination: { name: "Manali" },
    distance: 500000,
    duration: 36000,
    places: [
      { id: "p1", name: "Hadimba Temple", category: "attraction" },
      { id: "p2", name: "Mountain View Hotel", category: "hotel" },
      { id: "p3", name: "Pine Wood Cafe", category: "restaurant" },
    ],
  };

  const response = generateIntelligentFallbackReply({
    message: "Draft an itinerary for this trip",
    tripContext,
  });

  assert.match(response.reply, /Morning \/ Departure/);
  assert.match(response.reply, /Midday \/ Lunch/);
  assert.match(response.reply, /Evening \/ Arrival/);
  assert.ok(response.recommendedPlaces.length >= 1);
});
