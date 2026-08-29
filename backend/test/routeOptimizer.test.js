const assert = require("node:assert/strict");
const test = require("node:test");
const { getHaversineDistance, optimizeWaypoints } = require("../utils/routeOptimizer");

test("getHaversineDistance computes accurate geographical distances", () => {
  const delhi = { lat: 28.6139, lon: 77.2090 };
  const agra = { lat: 27.1767, lon: 78.0081 };
  const dist = getHaversineDistance(delhi, agra);

  // Approximately 180-190 km geodesic distance
  assert.ok(dist > 170000 && dist < 200000, `Expected ~180km, got ${dist}`);
});

test("optimizeWaypoints reorders out-of-order waypoints along a corridor", () => {
  const start = { name: "Delhi", lat: 28.6139, lon: 77.2090 };
  const stopMathura = { name: "Mathura", lat: 27.4924, lon: 77.6737 };
  const stopFaridabad = { name: "Faridabad", lat: 28.4089, lon: 77.3178 };
  const destination = { name: "Agra", lat: 27.1767, lon: 78.0081 };

  // Given out-of-order: Mathura first then Faridabad (which is closer to Delhi)
  const inputWaypoints = [stopMathura, stopFaridabad];
  const optimized = optimizeWaypoints(start, inputWaypoints, destination);

  // Optimized should put Faridabad before Mathura
  assert.equal(optimized.length, 2);
  assert.equal(optimized[0].name, "Faridabad");
  assert.equal(optimized[1].name, "Mathura");
});

test("optimizeWaypoints handles single or empty waypoints safely", () => {
  const start = { name: "Delhi", lat: 28.6139, lon: 77.2090 };
  const dest = { name: "Agra", lat: 27.1767, lon: 78.0081 };

  assert.deepEqual(optimizeWaypoints(start, [], dest), []);
  const single = [{ name: "Mathura", lat: 27.49, lon: 77.67 }];
  assert.deepEqual(optimizeWaypoints(start, single, dest), single);
});

