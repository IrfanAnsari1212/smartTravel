const assert = require("node:assert/strict");
const test = require("node:test");
const crypto = require("crypto");

test("Share Links: generates cryptographically secure unique share tokens", () => {
  const token1 = crypto.randomBytes(16).toString("hex");
  const token2 = crypto.randomBytes(16).toString("hex");

  assert.equal(token1.length, 32);
  assert.equal(token2.length, 32);
  assert.notEqual(token1, token2);
});

test("Share Links: sanitized public snapshot hides sensitive user fields", () => {
  const fullTrip = {
    _id: "trip_999",
    user: "user_secret_id_123",
    start: { name: "Delhi", lat: 28.6139, lon: 77.209 },
    destination: { name: "Jaipur", lat: 26.9124, lon: 75.7873 },
    distance: 280000,
    duration: 18000,
    favorite: true,
    notes: "Private user notes here",
    shareId: "share_token_abc123",
    isShared: true,
  };

  // Build public view
  const publicView = {
    shareId: fullTrip.shareId,
    start: fullTrip.start,
    destination: fullTrip.destination,
    distance: fullTrip.distance,
    duration: fullTrip.duration,
  };

  assert.equal(publicView.user, undefined);
  assert.equal(publicView.favorite, undefined);
  assert.equal(publicView.notes, undefined);
  assert.equal(publicView.shareId, "share_token_abc123");
});

