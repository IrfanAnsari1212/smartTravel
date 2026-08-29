const assert = require("node:assert/strict");
const test = require("node:test");
const axios = require("axios");

const { queryNominatim, reverseNominatim } = require("../adapters/nominatimAdapter");
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

test("reverseNominatim returns normalized reverse geocoded place", async (t) => {
  const originalGet = axios.get;
  t.after(() => { axios.get = originalGet; });

  axios.get = async (url, config) => {
    assert.equal(config.params.lat, 28.4595);
    assert.equal(config.params.lon, 77.0266);
    return {
      data: {
        place_id: 1234,
        display_name: "Gurugram, Haryana, India",
        lat: "28.4595",
        lon: "77.0266",
      },
    };
  };

  const result = await reverseNominatim(28.4595, 77.0266);
  assert.deepEqual(result, {
    placeId: 1234,
    displayName: "Gurugram, Haryana, India",
    lat: 28.4595,
    lon: 77.0266,
  });
});

test("osrmAdapter parses route response and extracts turn-by-turn steps", async (t) => {
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
          legs: [
            {
              steps: [
                {
                  distance: 500,
                  duration: 60,
                  name: "Outer Ring Road",
                  maneuver: { type: "depart", modifier: "straight", location: [77.2, 28.6] },
                },
                {
                  distance: 1200,
                  duration: 120,
                  name: "NH44",
                  maneuver: { type: "turn", modifier: "right", location: [77.21, 28.61] },
                },
                {
                  distance: 0,
                  duration: 0,
                  name: "",
                  maneuver: { type: "arrive", modifier: "straight", location: [72.8, 19.0] },
                },
              ],
            },
          ],
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
  assert.equal(route.steps.length, 3);
  assert.match(route.steps[0].instruction, /Outer Ring Road/);
  assert.match(route.steps[1].instruction, /Turn right onto NH44/);
  assert.match(route.steps[2].instruction, /arrived/);
});

test("osrmAdapter supports multi-waypoint coordinate arrays", async (t) => {
  const originalGet = axios.get;
  t.after(() => { axios.get = originalGet; });

  let calledUrl = "";
  axios.get = async (url) => {
    calledUrl = url;
    return {
      data: {
        routes: [
          {
            distance: 210000,
            duration: 9000,
            geometry: { coordinates: [[77.2, 28.6], [77.6, 27.5], [78.0, 27.2]], type: "LineString" },
            legs: [{ steps: [] }, { steps: [] }],
          },
        ],
      },
    };
  };

  const points = [
    { lon: 77.2, lat: 28.6, name: "Delhi" },
    { lon: 77.6, lat: 27.5, name: "Mathura" },
    { lon: 78.0, lat: 27.2, name: "Agra" },
  ];

  const route = await queryOsrmRoute(points);
  assert.ok(calledUrl.includes("77.2,28.6;77.6,27.5;78,27.2"));
  assert.equal(route.distance, 210000);
  assert.equal(route.legs.length, 2);
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
