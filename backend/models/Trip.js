const mongoose = require("mongoose");

const pointSchema = new mongoose.Schema(
  {
    name: String,
    lat: Number,
    lon: Number,
  },
  { _id: false }
);

const placeSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    category: String,
    lat: Number,
    lon: Number,
    address: String,
    brand: String,
    cuisine: String,
    openingHours: String,
    phone: String,
    website: String,
    highlights: { type: [String], default: [] },
  },
  { _id: false }
);

const stepSchema = new mongoose.Schema(
  {
    index: Number,
    instruction: String,
    type: String,
    modifier: String,
    distance: Number,
    duration: Number,
    roadName: String,
    location: { type: [Number], default: [] }, // [lon, lat]
  },
  { _id: false }
);

const stopSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    name: { type: String, required: true },
    lat: Number,
    lon: Number,
    address: { type: String, default: "" },
    category: { type: String, default: "attraction" },
    notes: { type: String, default: "" },
    estimatedArrival: { type: String, default: "09:00" },
    departureTime: { type: String, default: "11:00" },
    durationMinutes: { type: Number, default: 120 },
    distanceFromPrevKm: { type: Number, default: 0 },
  },
  { _id: false }
);

const daySchema = new mongoose.Schema(
  {
    dayNumber: { type: Number, required: true },
    title: { type: String, default: "" },
    date: { type: String, default: "" },
    startLocation: { type: pointSchema },
    endLocation: { type: pointSchema },
    stops: { type: [stopSchema], default: [] },
    totalDistanceKm: { type: Number, default: 0 },
    totalDurationMinutes: { type: Number, default: 0 },
    notes: { type: String, default: "" },
  },
  { _id: false }
);

const tripOptionsSchema = new mongoose.Schema(
  {
    avoidTolls: { type: Boolean, default: false },
    avoidHighways: { type: Boolean, default: false },
    optimized: { type: Boolean, default: false },
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    startQuery: { type: String, required: true },
    destinationQuery: { type: String, required: true },
    start: { type: pointSchema, required: true },
    destination: { type: pointSchema, required: true },
    waypoints: { type: [pointSchema], default: [] },
    options: { type: tripOptionsSchema, default: () => ({}) },
    filters: { type: [String], default: [] },
    distance: { type: Number, required: true },
    duration: { type: Number, required: true },
    geometry: {
      type: {
        type: String,
        default: "LineString",
      },
      coordinates: {
        type: [[Number]],
        default: [],
      },
    },
    steps: { type: [stepSchema], default: [] },
    days: { type: [daySchema], default: [] },
    places: { type: [placeSchema], default: [] },
    emergencyServices: {
      fuel: { type: [placeSchema], default: [] },
      hotel: { type: [placeSchema], default: [] },
      hospital: { type: [placeSchema], default: [] },
      police: { type: [placeSchema], default: [] },
      mechanic: { type: [placeSchema], default: [] },
    },
    placeLookup: {
      status: { type: String, enum: ["available", "unavailable"], default: "available" },
      failedPoints: { type: Number, default: 0 },
    },
    favorite: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

tripSchema.index({ userId: 1, favorite: -1, createdAt: -1 });

module.exports = mongoose.models.Trip || mongoose.model("Trip", tripSchema);
