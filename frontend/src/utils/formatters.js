export const PLACE_FILTERS = [
  { id: "attraction", label: "Attractions", icon: "🏛️" },
  { id: "restaurant", label: "Food & Cafes", icon: "🍽️" },
  { id: "hotel", label: "Hotels & Stays", icon: "🏨" },
  { id: "fuel", label: "Fuel & EV", icon: "⛽" },
  { id: "hospital", label: "Hospitals", icon: "🏥" },
  { id: "police", label: "Police", icon: "👮" },
  { id: "mechanic", label: "Mechanics", icon: "🔧" },
  { id: "pharmacy", label: "Pharmacies", icon: "💊" },
  { id: "atm", label: "ATMs", icon: "🏧" },
  { id: "parking", label: "Parking", icon: "🅿️" },
];

export const EMERGENCY_SERVICE_CONFIG = [
  { id: "fuel", label: "Fuel & EV", emptyLabel: "No fuel stations saved" },
  { id: "hotel", label: "Hotel & Stays", emptyLabel: "No hotels saved" },
  { id: "hospital", label: "Hospital & Medical", emptyLabel: "No hospitals saved" },
  { id: "police", label: "Police Station", emptyLabel: "No police stations saved" },
  { id: "mechanic", label: "Car Repair & Mechanic", emptyLabel: "No mechanics saved" },
];

export const ALL_FILTER_IDS = PLACE_FILTERS.map((filter) => filter.id);

export const formatDistance = (distance) => `${(distance / 1000).toFixed(1)} km`;

export const formatDuration = (duration) => `${(duration / 3600).toFixed(1)} hrs`;

export const formatSpeed = (speed) =>
  speed || speed === 0 ? `${(speed * 3.6).toFixed(1)} km/h` : "Waiting...";

export const formatFilterList = (filters = []) =>
  filters
    .map((filterId) => PLACE_FILTERS.find((filter) => filter.id === filterId)?.label || filterId)
    .join(", ");

export const normalizeExternalUrl = (value) =>
  value ? (/^https?:\/\//i.test(value) ? value : `https://${value}`) : "";

export const buildMapsSearchUrl = (place) =>
  `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`;

export const normalizeEmergencyServices = (services = {}) => ({
  fuel: Array.isArray(services.fuel) ? services.fuel : [],
  hotel: Array.isArray(services.hotel) ? services.hotel : [],
  hospital: Array.isArray(services.hospital) ? services.hospital : [],
  police: Array.isArray(services.police) ? services.police : [],
  mechanic: Array.isArray(services.mechanic) ? services.mechanic : [],
});

export const createEmptyMapVerification = () => ({
  metadata: null,
  cachedCount: 0,
  totalCount: 0,
  isVerified: false,
  supportsCacheStorage: typeof window !== "undefined" && "caches" in window,
  isChecking: false,
});

export const getDistanceBetweenPoints = (origin, target) => {
  if (!origin || !target) {
    return null;
  }

  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const latDelta = toRadians(target.lat - origin.lat);
  const lonDelta = toRadians(target.lon - origin.lon);
  const originLat = toRadians(origin.lat);
  const targetLat = toRadians(target.lat);
  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(originLat) * Math.cos(targetLat) * Math.sin(lonDelta / 2) ** 2;

  return 2 * earthRadius * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

export const getNearestPlace = (places, referencePoint) => {
  if (!places.length) {
    return null;
  }

  if (!referencePoint) {
    return {
      ...places[0],
      distanceFromReference: null,
    };
  }

  return places
    .map((place) => ({
      ...place,
      distanceFromReference: getDistanceBetweenPoints(referencePoint, place),
    }))
    .sort((left, right) => (left.distanceFromReference ?? Infinity) - (right.distanceFromReference ?? Infinity))[0];
};

export const tripFromHistory = (trip) => ({
  tripId: trip.id,
  start: trip.start,
  destination: trip.destination,
  distance: trip.distance,
  duration: trip.duration,
  geometry: trip.geometry,
  places: trip.places,
  emergencyServices: normalizeEmergencyServices(trip.emergencyServices),
  filters: trip.filters,
  placeLookup: trip.placeLookup,
});

export const routeFromOfflineTrip = (trip) => ({
  tripId: trip.tripId || trip.id,
  start: trip.start,
  destination: trip.destination,
  distance: trip.distance,
  duration: trip.duration,
  geometry: trip.geometry,
  places: trip.places,
  emergencyServices: normalizeEmergencyServices(trip.emergencyServices),
  filters: trip.filters,
  placeLookup: trip.placeLookup,
});
