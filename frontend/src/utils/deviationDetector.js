import { getDistanceBetweenPoints } from "./formatters";

/**
 * Calculates perpendicular/shortest distance in meters from a point P to a line segment AB
 */
export const getDistanceToSegment = (point, segA, segB) => {
  if (!point || !segA || !segB) return Infinity;

  const latP = point.lat;
  const lonP = point.lon;
  const latA = segA.lat;
  const lonA = segA.lon;
  const latB = segB.lat;
  const lonB = segB.lon;

  const dx = lonB - lonA;
  const dy = latB - latA;

  if (dx === 0 && dy === 0) {
    return getDistanceBetweenPoints(point, segA) ?? Infinity;
  }

  // Calculate projection parameter t
  const t = Math.max(0, Math.min(1, ((lonP - lonA) * dx + (latP - latA) * dy) / (dx * dx + dy * dy)));

  const projPoint = {
    lat: latA + t * dy,
    lon: lonA + t * dx,
  };

  return getDistanceBetweenPoints(point, projPoint) ?? Infinity;
};

/**
 * Calculates the minimum distance in meters from current position to the entire route polyline
 */
export const getDistanceToRoute = (point, routeCoordinates = []) => {
  if (!point || !routeCoordinates || routeCoordinates.length === 0) {
    return 0;
  }

  if (routeCoordinates.length === 1) {
    return getDistanceBetweenPoints(point, routeCoordinates[0]) ?? 0;
  }

  let minDistance = Infinity;

  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    const dist = getDistanceToSegment(point, routeCoordinates[i], routeCoordinates[i + 1]);
    if (dist < minDistance) {
      minDistance = dist;
    }
  }

  return minDistance === Infinity ? 0 : minDistance;
};

/**
 * Checks if user has deviated from the planned route beyond threshold
 * @param {Object} point - Current GPS coordinate { lat, lon }
 * @param {Array} routeCoordinates - Array of { lat, lon }
 * @param {number} thresholdMeters - Deviation threshold in meters (default 120m)
 */
export const checkRouteDeviation = (point, routeCoordinates = [], thresholdMeters = 120) => {
  if (!point || !routeCoordinates || routeCoordinates.length < 2) {
    return {
      isDeviated: false,
      distanceOffRouteMeters: 0,
      thresholdMeters,
    };
  }

  const distanceOffRouteMeters = Math.round(getDistanceToRoute(point, routeCoordinates));
  const isDeviated = distanceOffRouteMeters > thresholdMeters;

  return {
    isDeviated,
    distanceOffRouteMeters,
    thresholdMeters,
  };
};

/**
 * Calculates estimated arrival time (ETA) based on remaining distance and current/average speed
 */
export const calculateDynamicEta = (remainingDistanceMeters, speedMetersPerSecond) => {
  if (!Number.isFinite(remainingDistanceMeters) || remainingDistanceMeters <= 0) {
    return {
      etaFormatted: "Arrived",
      etaDurationMinutes: 0,
      etaTimestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  }

  // If live speed is too low (< 5 km/h ~ 1.38 m/s), assume typical highway/city average of 50 km/h (13.88 m/s)
  const effectiveSpeedMs = speedMetersPerSecond && speedMetersPerSecond > 1.5
    ? speedMetersPerSecond
    : 13.88;

  const totalSeconds = Math.round(remainingDistanceMeters / effectiveSpeedMs);
  const totalMinutes = Math.round(totalSeconds / 60);

  const etaDate = new Date(Date.now() + totalSeconds * 1000);
  const etaTimestamp = etaDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const etaFormatted = hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`;

  return {
    etaFormatted,
    etaDurationMinutes: totalMinutes,
    etaTimestamp,
  };
};

