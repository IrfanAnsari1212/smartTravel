const assert = require("node:assert/strict");
const test = require("node:test");
const axios = require("axios");

const { getPlacesNearby, getPlaceCategory } = require("../services/placeService");
const { placesCache } = require("../services/cacheService");

test("nearby places uses the Overpass form payload and supports way centres", async (t) => {
  placesCache.clear();
  const originalPost = axios.post;
  t.after(() => {
    axios.post = originalPost;
    placesCache.clear();
  });

  axios.post = async (url, payload, options) => {
    assert.equal(options.headers["Content-Type"], "application/x-www-form-urlencoded");
    assert.match(payload.get("data"), /restaurant/);
    return {
      data: {
        elements: [
          { id: 1, lat: 28.6, lon: 77.2, tags: { amenity: "restaurant", name: "Node Cafe" } },
          { id: 2, center: { lat: 28.61, lon: 77.21 }, tags: { tourism: "hotel", name: "Way Hotel" } },
        ],
      },
    };
  };

  const places = await getPlacesNearby(28.6, 77.2, ["restaurant", "hotel"]);
  assert.deepEqual(places.map((place) => place.name), ["Node Cafe", "Way Hotel"]);
  assert.equal(places[1].lat, 28.61);
});

test("getPlaceCategory categorizes attractions, viewpoints, historic spots, food, and stays", () => {
  assert.equal(getPlaceCategory({ tourism: "viewpoint" }), "attraction");
  assert.equal(getPlaceCategory({ historic: "monument" }), "attraction");
  assert.equal(getPlaceCategory({ tourism: "museum" }), "attraction");
  assert.equal(getPlaceCategory({ natural: "beach" }), "attraction");
  assert.equal(getPlaceCategory({ leisure: "park" }), "attraction");
  assert.equal(getPlaceCategory({ amenity: "cafe" }), "restaurant");
  assert.equal(getPlaceCategory({ tourism: "guest_house" }), "hotel");
  assert.equal(getPlaceCategory({ amenity: "police" }), "police");
  assert.equal(getPlaceCategory({ amenity: "pharmacy" }), "pharmacy");
});

test("placesCache caches nearby lookups and prevents duplicate network requests", async (t) => {
  placesCache.clear();
  let networkCalls = 0;
  const originalPost = axios.post;
  t.after(() => {
    axios.post = originalPost;
    placesCache.clear();
  });

  axios.post = async () => {
    networkCalls += 1;
    return {
      data: {
        elements: [
          { id: 101, lat: 28.6, lon: 77.2, tags: { tourism: "attraction", name: "India Gate" } },
        ],
      },
    };
  };

  const firstCall = await getPlacesNearby(28.6, 77.2, ["attraction"]);
  const secondCall = await getPlacesNearby(28.6, 77.2, ["attraction"]);

  assert.equal(networkCalls, 1);
  assert.equal(firstCall.length, 1);
  assert.equal(secondCall.length, 1);
  assert.equal(secondCall[0].name, "India Gate");
});

test("nearby places exposes an upstream failure instead of returning a false empty result", async (t) => {
  placesCache.clear();
  const originalPost = axios.post;
  t.after(() => {
    axios.post = originalPost;
    placesCache.clear();
  });
  axios.post = async () => {
    throw new Error("provider timed out");
  };

  await assert.rejects(
    getPlacesNearby(29.1, 78.1, ["restaurant"]),
    (error) => error.statusCode === 503 && error.message === "Nearby places are temporarily unavailable"
  );
});
