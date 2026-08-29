const assert = require("node:assert/strict");
const test = require("node:test");
const axios = require("axios");

const { getPlacesNearby } = require("../services/placeService");

test("nearby places uses the Overpass form payload and supports way centres", async (t) => {
  const originalPost = axios.post;
  t.after(() => {
    axios.post = originalPost;
  });

  axios.post = async (url, payload, options) => {
    assert.equal(options.headers["Content-Type"], "application/x-www-form-urlencoded");
    assert.match(payload.get("data"), /nwr\["amenity"="restaurant"\]/);
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

test("nearby places exposes an upstream failure instead of returning a false empty result", async (t) => {
  const originalPost = axios.post;
  t.after(() => {
    axios.post = originalPost;
  });
  axios.post = async () => {
    throw new Error("provider timed out");
  };

  await assert.rejects(
    getPlacesNearby(28.6, 77.2),
    (error) => error.statusCode === 503 && error.message === "Nearby places are temporarily unavailable"
  );
});
