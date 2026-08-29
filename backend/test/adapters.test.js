const assert = require("node:assert/strict");
const test = require("node:test");
const axios = require("axios");

const { queryNominatim } = require("../adapters/nominatimAdapter");
const { queryOsrmRoute } = require("../adapters/osrmAdapter");
const { queryOverpass } = require("../adapters/overpassAdapter");

test("nominatimAdapter returns normalized place objects", async (t) => {
  const originalGet = axios.get;
  t.after(() => { axios.get = originalGet; });

  axios.get = async (url, config) => {
    assert.equal(config.params.q, "mumbai");
    return {
      data: [
        {
          place_id: 999,
          display_name: "Mumbai, Maharashtra, India",
          lat: "19.0760",
          lon: "72.8777",
        },
      ],
    };
  };

  const results = await queryNominatim("mumbai");
  assert.equal(results.length, 1);
  assert.deepEqual(results[0], {
    placeId: 999,
    displayName: "Mumbai, Maharashtra, India",
    lat: 19.076,
    lon: 72.8777,
  });
});

test("osrmAdapter parses route response or throws 404", async (t) => {
  const originalGet = axios.get;
  t.after(() => { axios.get = originalGet; });

  axios.get = async () => ({
    data: {
      routes: [
        {
          distance: 1400000,
          duration: 72000,
          geometry: {
            coordinates: [[77.2, 28.6], [72.8, 19.0]],
            type: "LineString",
          },
        },
      ],
    },
  });

  const route = await queryOsrmRoute(
    { lon: 77.2, lat: 28.6, name: "Delhi" },
    { lon: 72.8, lat: 19.0, name: "Mumbai" }
  );

  assert.equal(route.distance, 1400000);
  assert.equal(route.geometry.coordinates.length, 2);
});

test("overpassAdapter maps network failures to 503", async (t) => {
  const originalPost = axios.post;
  t.after(() => { axios.post = originalPost; });

  axios.post = async () => {
    const err = new Error("Connection reset by peer");
    err.code = "ECONNRESET";
    throw err;
  };

  await assert.rejects(
    queryOverpass("[out:json]; (node(around:1000, 28.6, 77.2);); out;"),
    (err) => err.statusCode === 503 && err.message === "Nearby places are temporarily unavailable"
  );
});
