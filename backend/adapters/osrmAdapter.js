const axios = require("axios");
const { withRetry } = require("../utils/retry");

const ROUTE_BASE_URL =
  process.env.OSRM_BASE_URL || "https://router.project-osrm.org";
const ROUTE_TIMEOUT_MS = Number(process.env.OSRM_TIMEOUT_MS) || 8000;

const generateInstruction = (step, index, total) => {
  const maneuver = step.maneuver || {};
  const modifier = maneuver.modifier ? ` ${maneuver.modifier}` : "";
  const roadName = step.name ? ` onto ${step.name}` : "";

  if (maneuver.type === "depart" || index === 0) {
    return `Head${modifier || " out"}${step.name ? ` on ${step.name}` : ""}`;
  }
  if (maneuver.type === "arrive" || index === total - 1) {
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

const extractSteps = (route, start, destination) => {
  const steps = [];
  const legs = route.legs || [];

  for (const leg of legs) {
    if (Array.isArray(leg.steps)) {
      leg.steps.forEach((step, idx) => {
        const instruction = generateInstruction(step, idx, leg.steps.length);
        steps.push({
          index: steps.length,
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
  }

  if (!steps.length) {
    steps.push({
      index: 0,
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

const queryOsrmRoute = async (start, destination) => {
  const url = `${ROUTE_BASE_URL}/route/v1/driving/${start.lon},${start.lat};${destination.lon},${destination.lat}?overview=full&geometries=geojson&steps=true&annotations=true`;

  return withRetry(async () => {
    const response = await axios.get(url, {
      timeout: ROUTE_TIMEOUT_MS,
    });

    const route = response.data?.routes?.[0];

    if (!route?.geometry?.coordinates?.length) {
      const error = new Error(
        `No drivable route found between "${start.name || "Start"}" and "${destination.name || "Destination"}".`
      );
      error.statusCode = 404;
      throw error;
    }

    const steps = extractSteps(route, start, destination);

    return {
      distance: route.distance,
      duration: route.duration,
      geometry: route.geometry,
      steps,
    };
  });
};

module.exports = {
  queryOsrmRoute,
  extractSteps,
  generateInstruction,
};
