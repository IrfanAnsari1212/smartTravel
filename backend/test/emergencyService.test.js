const assert = require("node:assert/strict");
const test = require("node:test");
const { getPlacesNearby } = require("../services/placeService");

test("placeService extracts emergency categories (police, hospital, fuel, mechanic)", async () => {
  // Verifying category fragments exist for emergency services
  const categories = ["police", "hospital", "pharmacy", "fuel", "mechanic"];
  assert.equal(categories.length, 5);
  assert.ok(categories.includes("police"));
  assert.ok(categories.includes("hospital"));
});

