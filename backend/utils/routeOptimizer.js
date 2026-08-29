/**
 * Isolated Deterministic Route Optimizer
 *
 * Implements deterministic TSP algorithms (Exact Permutations & 2-Opt local search)
 * and route segment recalculation engine.
 */

const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculates Haversine distance in meters between two geographical points
 */
const getHaversineDistance = (p1, p2) => {
  if (!p1 || !p2 || !Number.isFinite(p1.lat) || !Number.isFinite(p1.lon) || !Number.isFinite(p2.lat) || !Number.isFinite(p2.lon)) {
    return 0;
  }

  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(p2.lat - p1.lat);
  const dLon = toRad(p2.lon - p1.lon);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(p1.lat)) *
      Math.cos(toRad(p2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
};

/**
 * Computes total tour cost (distance) for a specific stop sequence between start and destination
 */
const calculateTourCost = (start, sequence, destination) => {
  if (!sequence.length) {
    return getHaversineDistance(start, destination);
  }

  let totalCost = getHaversineDistance(start, sequence[0]);

  for (let i = 0; i < sequence.length - 1; i++) {
    totalCost += getHaversineDistance(sequence[i], sequence[i + 1]);
  }

  totalCost += getHaversineDistance(sequence[sequence.length - 1], destination);
  return totalCost;
};

/**
 * Generates all permutations deterministically
 */
const generatePermutations = (items) => {
  if (items.length <= 1) return [items];
  const result = [];

  for (let i = 0; i < items.length; i++) {
    const current = items[i];
    const remaining = [...items.slice(0, i), ...items.slice(i + 1)];
    const perms = generatePermutations(remaining);
    for (const perm of perms) {
      result.push([current, ...perm]);
    }
  }

  return result;
};

/**
 * Exact deterministic permutation search for N <= 7 stops
 */
const getExactPermutationRoute = (start, waypoints, destination) => {
  const allPerms = generatePermutations(waypoints);
  let bestCost = Infinity;
  let bestSequence = waypoints;

  for (const perm of allPerms) {
    const cost = calculateTourCost(start, perm, destination);
    if (cost < bestCost) {
      bestCost = cost;
      bestSequence = perm;
    }
  }

  return bestSequence;
};

/**
 * Deterministic 2-Opt local search improvement for larger stop sets (N > 7)
 */
const get2OptOptimizedRoute = (start, waypoints, destination) => {
  // 1. Initial Greedy Nearest Neighbor tour
  const unvisited = [...waypoints];
  let current = start;
  const tour = [];

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let shortestDist = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = getHaversineDistance(current, unvisited[i]);
      if (dist < shortestDist) {
        shortestDist = dist;
        nearestIdx = i;
      }
    }

    const nextStop = unvisited.splice(nearestIdx, 1)[0];
    tour.push(nextStop);
    current = nextStop;
  }

  // 2. Apply deterministic 2-Opt edge swaps
  let improved = true;
  let iterations = 0;
  const maxIterations = 50;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 0; i < tour.length - 1; i++) {
      for (let k = i + 1; k < tour.length; k++) {
        // Create 2-opt swap: reverse segment between i and k
        const candidate = [
          ...tour.slice(0, i),
          ...tour.slice(i, k + 1).reverse(),
          ...tour.slice(k + 1),
        ];

        const currentCost = calculateTourCost(start, tour, destination);
        const newCost = calculateTourCost(start, candidate, destination);

        if (newCost < currentCost - 1) { // minimum 1m improvement
          tour.splice(0, tour.length, ...candidate);
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }

  return tour;
};

/**
 * Optimizes the waypoint sequence deterministically
 */
const optimizeWaypoints = (start, waypoints = [], destination) => {
  if (!waypoints || waypoints.length <= 1) {
    return waypoints || [];
  }

  if (waypoints.length <= 7) {
    return getExactPermutationRoute(start, waypoints, destination);
  }

  return get2OptOptimizedRoute(start, waypoints, destination);
};

/**
 * Calculates detailed route segments between sequential stops
 */
const calculateRouteSegments = (orderedPoints = [], departureTimeMinutes = 9 * 60) => {
  if (orderedPoints.length < 2) return [];

  const segments = [];
  let currentMinute = departureTimeMinutes;
  let cumulativeDistanceMeters = 0;
  let cumulativeDurationSeconds = 0;

  for (let i = 0; i < orderedPoints.length - 1; i++) {
    const fromPoint = orderedPoints[i];
    const toPoint = orderedPoints[i + 1];
    const distanceMeters = Math.round(getHaversineDistance(fromPoint, toPoint));

    // Estimated driving speed: ~55 km/h average -> ~15.28 m/s
    const durationSeconds = Math.max(120, Math.round(distanceMeters / 15.28));
    const travelMinutes = Math.round(durationSeconds / 60);

    const departureMinutes = currentMinute;
    currentMinute += travelMinutes;
    const arrivalMinutes = currentMinute;

    const formatTime = (mins) => {
      const h = Math.floor(mins / 60) % 24;
      const m = mins % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };

    cumulativeDistanceMeters += distanceMeters;
    cumulativeDurationSeconds += durationSeconds;

    segments.push({
      segmentIndex: i,
      from: {
        name: fromPoint.name || `Point ${i + 1}`,
        lat: fromPoint.lat,
        lon: fromPoint.lon,
        departureTime: formatTime(departureMinutes),
      },
      to: {
        name: toPoint.name || `Point ${i + 2}`,
        lat: toPoint.lat,
        lon: toPoint.lon,
        estimatedArrival: formatTime(arrivalMinutes),
      },
      distanceMeters,
      distanceKm: Number((distanceMeters / 1000).toFixed(1)),
      durationSeconds,
      durationMinutes: travelMinutes,
      cumulativeDistanceKm: Number((cumulativeDistanceMeters / 1000).toFixed(1)),
      cumulativeDurationMinutes: Math.round(cumulativeDurationSeconds / 60),
    });

    // Add stop layover buffer (e.g. 30 mins) for intermediate stops
    if (i < orderedPoints.length - 2) {
      currentMinute += 30;
    }
  }

  return segments;
};

module.exports = {
  getHaversineDistance,
  calculateTourCost,
  optimizeWaypoints,
  getExactPermutationRoute,
  get2OptOptimizedRoute,
  calculateRouteSegments,
};
