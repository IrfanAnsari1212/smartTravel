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
