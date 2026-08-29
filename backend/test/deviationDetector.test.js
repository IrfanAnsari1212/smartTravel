const assert = require("node:assert/strict");
const test = require("node:test");
const { getHaversineDistance } = require("../utils/routeOptimizer");

// Direct unit test of cross-track segment math
const getDistanceToSegmentMath = (point, segA, segB) => {
  const dx = segB.lon - segA.lon;
  const dy = segB.lat - segA.lat;

  if (dx === 0 && dy === 0) {
    return getHaversineDistance(point, segA);
  }

  const t = Math.max(0, Math.min(1, ((point.lon - segA.lon) * dx + (point.lat - segA.lat) * dy) / (dx * dx + dy * dy)));
  const projPoint = {
    lat: segA.lat + t * dy,
    lon: segA.lon + t * dx,
  };

  return getHaversineDistance(point, projPoint);
};

test("getDistanceToSegmentMath accurately calculates on-route vs off-route distances", () => {
  const segA = { lat: 28.60, lon: 77.20 };
  const segB = { lat: 28.60, lon: 77.30 };

  // Point directly on the line segment
  const onRoute = { lat: 28.60, lon: 77.25 };
  const onRouteDist = getDistanceToSegmentMath(onRoute, segA, segB);
  assert.ok(onRouteDist < 5, `Expected on-route distance < 5m, got ${onRouteDist}`);

  // Point 1 km north of the line segment
  const offRoute = { lat: 28.609, lon: 77.25 };
  const offRouteDist = getDistanceToSegmentMath(offRoute, segA, segB);
  assert.ok(offRouteDist > 900 && offRouteDist < 1100, `Expected ~1000m, got ${offRouteDist}`);
});
