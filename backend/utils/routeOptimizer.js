const getHaversineDistance = (p1, p2) => {
  if (!p1 || !p2) return 0;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000; // meters

  const dLat = toRad(p2.lat - p1.lat);
  const dLon = toRad(p2.lon - p1.lon);
  const lat1 = toRad(p1.lat);
  const lat2 = toRad(p2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getPermutations = (arr) => {
  if (arr.length <= 1) return [arr];
  const results = [];
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
    const perms = getPermutations(remaining);
    for (const p of perms) {
      results.push([current, ...p]);
    }
  }
  return results;
};

/**
 * Optimizes the sequence of intermediate waypoints to minimize total trip distance
 * @param {Object} start - { lat, lon, name }
 * @param {Array} waypoints - Array of { lat, lon, name }
 * @param {Object} destination - { lat, lon, name }
 * @returns {Array} Optimized array of waypoints
 */
const optimizeWaypoints = (start, waypoints = [], destination) => {
  if (!waypoints || waypoints.length <= 1) {
    return waypoints;
  }

  // Exact permutation search for up to 7 waypoints (7! = 5040 iterations)
  if (waypoints.length <= 7) {
    const perms = getPermutations(waypoints);
    let bestPerm = waypoints;
    let minDistance = Infinity;

    for (const perm of perms) {
      let totalDist = getHaversineDistance(start, perm[0]);
      for (let i = 0; i < perm.length - 1; i++) {
        totalDist += getHaversineDistance(perm[i], perm[i + 1]);
      }
      totalDist += getHaversineDistance(perm[perm.length - 1], destination);

      if (totalDist < minDistance) {
        minDistance = totalDist;
        bestPerm = perm;
      }
    }

    return bestPerm;
  }

  // Nearest Neighbor greedy heuristic for >7 waypoints
  const unvisited = [...waypoints];
  const ordered = [];
  let current = start;

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = getHaversineDistance(current, unvisited[i]);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    }

    current = unvisited.splice(nearestIdx, 1)[0];
    ordered.push(current);
  }

  return ordered;
};

module.exports = {
  getHaversineDistance,
  optimizeWaypoints,
};

