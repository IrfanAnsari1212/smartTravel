const assert = require("node:assert/strict");
const test = require("node:test");
const {
  GroundedRuleEngineProvider,
  getAIProvider,
} = require("../adapters/aiProvider");
const { buildTripContextSummary } = require("../services/aiContextBuilder");

test("AI Provider: GroundedRuleEngine produces structured itinerary suggestions", async () => {
  const provider = new GroundedRuleEngineProvider();
  const tripContext = {
    start: { name: "New Delhi" },
    destination: { name: "Agra" },
    places: [
      { id: "p1", name: "Taj Mahal", category: "attraction" },
      { id: "p2", name: "Agra Fort", category: "attraction" },
      { id: "p3", name: "Pinch of Spice", category: "restaurant" },
    ],
  };

  const result = await provider.generateStructuredRecommendation({
    promptType: "itinerary",
    tripContext,
  });

  assert.equal(result.type, "itinerary");
  assert.ok(result.data.days.length > 0);
  assert.equal(result.data.days[0].stops[0].name, "Taj Mahal");
});

test("AI Provider: GroundedRuleEngine produces structured POI recommendations", async () => {
  const provider = new GroundedRuleEngineProvider();
  const tripContext = {
    places: [
      { id: "p1", name: "Hawa Mahal", category: "attraction", address: "Jaipur" },
    ],
  };

  const result = await provider.generateStructuredRecommendation({
    promptType: "poi",
    tripContext,
  });

  assert.equal(result.type, "poi");
  assert.equal(result.data.recommendedStops[0].name, "Hawa Mahal");
});

test("AI Context Builder: includes weather alerts and waypoints in prompt context", () => {
  const tripContext = {
    start: { name: "Mumbai" },
    destination: { name: "Pune" },
    distance: 150000,
    duration: 10800,
    waypoints: ["Lonavala"],
    weatherAlerts: [{ title: "Heavy Rain", message: "Monsoon showers expected", severity: "high" }],
    places: [{ id: "att-1", name: "Karla Caves", category: "attraction" }],
  };

  const contextStr = buildTripContextSummary(tripContext);
  assert.ok(contextStr.includes("Heavy Rain"));
  assert.ok(contextStr.includes("Lonavala"));
  assert.ok(contextStr.includes("Karla Caves"));
});

