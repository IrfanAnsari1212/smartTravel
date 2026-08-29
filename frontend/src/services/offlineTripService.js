const STORAGE_KEY = "travel-platform-offline-trips-v1";
const PACKAGE_TYPE = "travel-platform-offline-trip";
const BULK_BACKUP_TYPE = "travel-platform-bulk-backup";

const sortTrips = (trips) =>
  [...trips].sort(
    (left, right) => new Date(right.savedAt || 0).getTime() - new Date(left.savedAt || 0).getTime()
  );

export const calculateChecksum = async (content) => {
  try {
    if (typeof window !== "undefined" && window.crypto?.subtle) {
      const msgBuffer = new TextEncoder().encode(
        typeof content === "string" ? content : JSON.stringify(content)
      );
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch (err) {
    console.warn("Checksum generation fallback:", err.message);
  }
  return "checksum-unavailable";
};

export const readOfflineTrips = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const trips = raw ? JSON.parse(raw) : [];
    return Array.isArray(trips) ? trips : [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const writeOfflineTrips = (trips) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sortTrips(trips)));
};

const slugify = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "trip";

export const makeOfflineId = (startQuery, destinationQuery) =>
  `offline-${slugify(startQuery)}-${slugify(destinationQuery)}-${Date.now()}`;

export const normalizeEmergencyServices = (services = {}) => ({
  fuel: Array.isArray(services.fuel) ? services.fuel : [],
  hotel: Array.isArray(services.hotel) ? services.hotel : [],
  hospital: Array.isArray(services.hospital) ? services.hospital : [],
  police: Array.isArray(services.police) ? services.police : [],
  mechanic: Array.isArray(services.mechanic) ? services.mechanic : [],
});

export const validateTripPackage = (trip) => {
  if (!trip || (trip.type !== PACKAGE_TYPE && trip.type !== "smarttravel-trip-pack")) {
    throw new Error("This file is not a valid SmartTravel offline trip pack.");
  }

  if (!trip.startQuery || !trip.destinationQuery) {
    throw new Error("Offline trip pack is missing route location queries.");
  }

  if (!trip.geometry?.coordinates?.length) {
    throw new Error("Offline trip pack is missing route coordinates geometry.");
  }

  return {
    ...trip,
    type: PACKAGE_TYPE,
    version: 2,
    id: trip.id || makeOfflineId(trip.startQuery, trip.destinationQuery),
    syncStatus: trip.syncStatus || (trip.tripId ? "synced" : "local-only"),
    places: Array.isArray(trip.places) ? trip.places : [],
    emergencyServices: normalizeEmergencyServices(trip.emergencyServices),
    savedAt: trip.savedAt || new Date().toISOString(),
  };
};

export const createOfflineTripPack = ({ route, startQuery, destinationQuery }) =>
  validateTripPackage({
    type: PACKAGE_TYPE,
    schemaVersion: "2.0",
    version: 2,
    id: route.tripId || makeOfflineId(startQuery, destinationQuery),
    tripId: route.tripId || null,
    syncStatus: route.tripId ? "synced" : "local-only",
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
    emergencyServices: normalizeEmergencyServices(route.emergencyServices),
    savedAt: new Date().toISOString(),
    generator: "SmartTravel Platform v2.0",
  });

export const listOfflineTrips = () => sortTrips(readOfflineTrips());

export const saveOfflineTrip = (trip) => {
  const normalizedTrip = validateTripPackage(trip);
  const currentTrips = readOfflineTrips();
  const nextTrips = currentTrips.filter((item) => item.id !== normalizedTrip.id);
  nextTrips.unshift(normalizedTrip);
  writeOfflineTrips(nextTrips.slice(0, 50));
  return normalizedTrip;
};

export const updateTripSyncStatus = (tripId, status, serverTripId = null) => {
  const currentTrips = readOfflineTrips();
  const nextTrips = currentTrips.map((item) => {
    if (item.id === tripId) {
      return {
        ...item,
        syncStatus: status,
        tripId: serverTripId || item.tripId,
      };
    }
    return item;
  });
  writeOfflineTrips(nextTrips);
};

export const removeOfflineTrip = (tripId) => {
  const nextTrips = readOfflineTrips().filter((trip) => trip.id !== tripId);
  writeOfflineTrips(nextTrips);
};

export const downloadOfflineTrip = async (trip) => {
  const normalizedTrip = validateTripPackage(trip);
  const checksum = await calculateChecksum({
    id: normalizedTrip.id,
    start: normalizedTrip.start,
    destination: normalizedTrip.destination,
    geometry: normalizedTrip.geometry,
  });

  const exportPayload = {
    ...normalizedTrip,
    checksum,
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
    type: "application/json",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${slugify(normalizedTrip.startQuery)}-to-${slugify(
    normalizedTrip.destinationQuery
  )}-pack-v2.json`;
  link.click();

  window.URL.revokeObjectURL(url);
};

export const exportAllTripsArchive = () => {
  const trips = listOfflineTrips();
  const backupData = {
    type: BULK_BACKUP_TYPE,
    schemaVersion: "2.0",
    exportedAt: new Date().toISOString(),
    count: trips.length,
    trips,
    generator: "SmartTravel Platform v2.0",
  };

  const blob = new Blob([JSON.stringify(backupData, null, 2)], {
    type: "application/json",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  const dateStr = new Date().toISOString().split("T")[0];
  link.href = url;
  link.download = `smarttravel-backup-${dateStr}.json`;
  link.click();

  window.URL.revokeObjectURL(url);
};

export const parseOfflineTripFile = async (file) => {
  const text = await file.text();
  const parsed = JSON.parse(text);

  // Check if bulk archive
  if (parsed?.type === BULK_BACKUP_TYPE && Array.isArray(parsed.trips)) {
    const validTrips = [];
    for (const item of parsed.trips) {
      try {
        validTrips.push(validateTripPackage(item));
      } catch (err) {
        console.warn("Skipping invalid trip in archive:", err.message);
      }
    }
    return {
      isBulk: true,
      count: validTrips.length,
      trips: validTrips,
    };
  }

  // Single trip pack
  return {
    isBulk: false,
    trip: validateTripPackage(parsed),
  };
};
