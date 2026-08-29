const Trip = require("../models/Trip");

const toTripResponse = (trip) => {
  if (!trip) {
    return null;
  }

  const source = trip.toObject ? trip.toObject() : trip;

  return {
    id: source._id?.toString?.() || source.id,
    startQuery: source.startQuery,
    destinationQuery: source.destinationQuery,
    start: source.start,
    destination: source.destination,
    waypoints: source.waypoints || [],
    options: source.options || {},
    steps: source.steps || [],
    days: source.days || [],
    filters: source.filters || [],
    distance: source.distance,
    duration: source.duration,
    geometry: source.geometry,
    places: source.places || [],
    emergencyServices: source.emergencyServices || {},
    placeLookup: source.placeLookup || { status: "available", failedPoints: 0 },
    favorite: Boolean(source.favorite),
    createdAt: source.createdAt,
  };
};

const saveTrip = async (tripPayload) => {
  const trip = await Trip.create(tripPayload);
  return toTripResponse(trip);
};

const listTrips = async (userId, limit = 6) => {
  const trips = await Trip.find({ userId })
    .sort({ favorite: -1, createdAt: -1 })
    .limit(limit)
    .lean();
  return trips.map(toTripResponse);
};

const toggleFavorite = async (id, userId) => {
  const trip = await Trip.findOne({ _id: id, userId });

  if (!trip) {
    return null;
  }

  trip.favorite = !trip.favorite;
  await trip.save();
  return toTripResponse(trip);
};

module.exports = {
  listTrips,
  saveTrip,
  toggleFavorite,
};
