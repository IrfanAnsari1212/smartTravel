const mongoose = require("mongoose");

const Trip = require("../models/Trip");

const memoryTrips = [];

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
    filters: source.filters || [],
    distance: source.distance,
    duration: source.duration,
    geometry: source.geometry,
    places: source.places || [],
    emergencyServices: source.emergencyServices || {},
    favorite: Boolean(source.favorite),
    createdAt: source.createdAt,
  };
};

const isDatabaseReady = () => mongoose.connection.readyState === 1;

const saveTrip = async (tripPayload) => {
  if (isDatabaseReady()) {
    const trip = await Trip.create(tripPayload);
    return toTripResponse(trip);
  }

  const trip = {
    ...tripPayload,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    favorite: false,
    createdAt: new Date().toISOString(),
  };

  memoryTrips.unshift(trip);
  memoryTrips.splice(20);

  return toTripResponse(trip);
};

const listTrips = async (limit = 6) => {
  if (isDatabaseReady()) {
    const trips = await Trip.find({})
      .sort({ favorite: -1, createdAt: -1 })
      .limit(limit);

    return trips.map(toTripResponse);
  }

  return memoryTrips.slice(0, limit).map(toTripResponse);
};

const toggleFavorite = async (id) => {
  if (isDatabaseReady()) {
    const trip = await Trip.findById(id);

    if (!trip) {
      return null;
    }

    trip.favorite = !trip.favorite;
    await trip.save();
    return toTripResponse(trip);
  }

  const trip = memoryTrips.find((item) => item.id === id);

  if (!trip) {
    return null;
  }

  trip.favorite = !trip.favorite;
  return toTripResponse(trip);
};

module.exports = {
  listTrips,
  saveTrip,
  toggleFavorite,
};
