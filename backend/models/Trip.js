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
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
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
    places: { type: [placeSchema], default: [] },
    favorite: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Trip || mongoose.model("Trip", tripSchema);
