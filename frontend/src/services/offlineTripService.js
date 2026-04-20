const STORAGE_KEY = "travel-platform-offline-trips-v1";
const PACKAGE_TYPE = "travel-platform-offline-trip";

const sortTrips = (trips) =>
  [...trips].sort(
    (left, right) => new Date(right.savedAt).getTime() - new Date(left.savedAt).getTime()
  );

const readOfflineTrips = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

const writeOfflineTrips = (trips) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sortTrips(trips)));
};

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

const makeOfflineId = (startQuery, destinationQuery) =>
  `offline-${slugify(startQuery)}-${slugify(destinationQuery)}-${Date.now()}`;

const validateTripPackage = (trip) => {
  if (!trip || trip.type !== PACKAGE_TYPE) {
    throw new Error("This file is not a valid Travel Platform offline trip pack.");
  }

  if (!trip.startQuery || !trip.destinationQuery || !trip.geometry?.coordinates?.length) {
    throw new Error("Offline trip pack is missing route data.");
  }

  return trip;
};

export const createOfflineTripPack = ({ route, startQuery, destinationQuery }) =>
  validateTripPackage({
    type: PACKAGE_TYPE,
    version: 1,
    id: route.tripId || makeOfflineId(startQuery, destinationQuery),
    tripId: route.tripId || null,
    title: `${startQuery} to ${destinationQuery}`,
    startQuery,
    destinationQuery,
    start: route.start,
    destination: route.destination,
    filters: route.filters || [],
    distance: route.distance,
    duration: route.duration,
    geometry: route.geometry,
    places: route.places || [],
    savedAt: new Date().toISOString(),
  });

export const listOfflineTrips = () => sortTrips(readOfflineTrips());

export const saveOfflineTrip = (trip) => {
  const normalizedTrip = validateTripPackage(trip);
  const currentTrips = readOfflineTrips();
  const nextTrips = currentTrips.filter((item) => item.id !== normalizedTrip.id);
  nextTrips.unshift(normalizedTrip);
  writeOfflineTrips(nextTrips.slice(0, 25));
  return normalizedTrip;
};

export const removeOfflineTrip = (tripId) => {
  const nextTrips = readOfflineTrips().filter((trip) => trip.id !== tripId);
  writeOfflineTrips(nextTrips);
};

export const downloadOfflineTrip = (trip) => {
  const normalizedTrip = validateTripPackage(trip);
  const blob = new Blob([JSON.stringify(normalizedTrip, null, 2)], {
    type: "application/json",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${slugify(normalizedTrip.startQuery)}-to-${slugify(
    normalizedTrip.destinationQuery
  )}-offline-pack.json`;
  link.click();

  window.URL.revokeObjectURL(url);
};

export const parseOfflineTripFile = async (file) => {
  const text = await file.text();
  const parsed = JSON.parse(text);
  return validateTripPackage(parsed);
};
