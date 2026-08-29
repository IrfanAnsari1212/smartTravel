const axios = require("axios");
const { withRetry } = require("../utils/retry");

const ROUTE_BASE_URL =
  process.env.OSRM_BASE_URL || "https://router.project-osrm.org";
const ROUTE_TIMEOUT_MS = Number(process.env.OSRM_TIMEOUT_MS) || 8000;

const generateInstruction = (step, index, total, legIndex = 0, totalLegs = 1) => {
  const maneuver = step.maneuver || {};
  const modifier = maneuver.modifier ? ` ${maneuver.modifier}` : "";
  const roadName = step.name ? ` onto ${step.name}` : "";

  if (maneuver.type === "depart" || index === 0) {
    const legPrefix = totalLegs > 1 && legIndex > 0 ? `Depart stop ${legIndex}: ` : "";
    return `${legPrefix}Head${modifier || " out"}${step.name ? ` on ${step.name}` : ""}`;
  }
  if (maneuver.type === "arrive" || index === total - 1) {
    if (totalLegs > 1 && legIndex < totalLegs - 1) {
      return `Arrive at Stop ${legIndex + 1}`;
    }
    return "You have arrived at your destination";
  }
  if (maneuver.type === "roundabout" || maneuver.type === "rotary") {
    return `At the roundabout, take exit ${maneuver.exit || 1}${roadName}`;
  }
  if (maneuver.type === "turn") {
    return `Turn${modifier}${roadName}`;
  }
  if (maneuver.type === "fork") {
    return `Take the${modifier} fork${roadName}`;
  }
  if (maneuver.type === "merge") {
    return `Merge${modifier}${roadName}`;
  }
  if (maneuver.type === "on ramp") {
    return `Take the ramp${modifier}${roadName}`;
  }
  if (maneuver.type === "continue" || maneuver.type === "new name") {
    return `Continue${modifier}${step.name ? ` on ${step.name}` : " straight"}`;
  }

  return `${maneuver.type || "Continue"}${modifier}${roadName}`;
};

const extractSteps = (route, points = []) => {
  const steps = [];
  const legs = route.legs || [];
  const totalLegs = legs.length || 1;

  legs.forEach((leg, legIdx) => {
    if (Array.isArray(leg.steps)) {
      leg.steps.forEach((step, idx) => {
        const instruction = generateInstruction(
          step,
          idx,
          leg.steps.length,
          legIdx,
          totalLegs
        );
        steps.push({
          index: steps.length,
          legIndex: legIdx,
          instruction,
          type: step.maneuver?.type || "continue",
          modifier: step.maneuver?.modifier || "straight",
          distance: Number(step.distance || 0),
          duration: Number(step.duration || 0),
          roadName: step.name || "",
          location: step.maneuver?.location || [0, 0], // [lon, lat]
        });
      });
    }
  });

  if (!steps.length) {
    const start = points[0] || { name: "Start", lon: 0, lat: 0 };
    const destination = points[points.length - 1] || { name: "Destination", lon: 0, lat: 0 };

    steps.push({
      index: 0,
      legIndex: 0,
      instruction: `Depart from ${start.name || "Start"}`,
      type: "depart",
      modifier: "straight",
      distance: 0,
      duration: 0,
      roadName: "",
      location: [start.lon, start.lat],
    });
    steps.push({
      index: 1,
      legIndex: 0,
      instruction: `Follow route to ${destination.name || "Destination"}`,
      type: "continue",
      modifier: "straight",
      distance: Number(route.distance || 0),
      duration: Number(route.duration || 0),
      roadName: "",
      location: [destination.lon, destination.lat],
    });
    steps.push({
      index: 2,
      legIndex: 0,
      instruction: `Arrive at ${destination.name || "Destination"}`,
      type: "arrive",
      modifier: "straight",
      distance: 0,
      duration: 0,
      roadName: "",
      location: [destination.lon, destination.lat],
    });
  }

  return steps;
};

/**
 * Queries OSRM driving route supporting multiple waypoints
 * @param {Array|Object} startOrPoints - Either an Array of points [{lon, lat, name}, ...] or start point {lon, lat, name}
 * @param {Object} [destination] - Destination point if first argument is start point
 */
const queryOsrmRoute = async (startOrPoints, destination) => {
  let points = [];
  if (Array.isArray(startOrPoints)) {
    points = startOrPoints;
  } else if (startOrPoints && destination) {
    points = [startOrPoints, destination];
  } else {
    throw new Error("At least start and destination points are required for route query.");
  }

  if (points.length < 2) {
    throw new Error("At least 2 points are required to calculate a route.");
  }

  const coordsString = points.map((p) => `${p.lon},${p.lat}`).join(";");
  const url = `${ROUTE_BASE_URL}/route/v1/driving/${coordsString}?overview=full&geometries=geojson&steps=true&annotations=true`;

  return withRetry(async () => {
    const response = await axios.get(url, {
      timeout: ROUTE_TIMEOUT_MS,
    });

    const route = response.data?.routes?.[0];

    if (!route?.geometry?.coordinates?.length) {
      const error = new Error(
        `No drivable route found between "${points[0]?.name || "Start"}" and "${points[points.length - 1]?.name || "Destination"}".`
      );
      error.statusCode = 404;
      throw error;
    }

    const steps = extractSteps(route, points);

    return {
      distance: route.distance,
      duration: route.duration,
      geometry: route.geometry,
      legs: (route.legs || []).map((leg) => ({
        distance: leg.distance,
        duration: leg.duration,
        summary: leg.summary || "",
      })),
      steps,
    };
  });
};

module.exports = {
  queryOsrmRoute,
  extractSteps,
  generateInstruction,
};
