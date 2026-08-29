const mongoose = require("mongoose");

const emergencyContactSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Contact name is required"],
      trim: true,
      maxlength: 80,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      maxlength: 25,
    },
    relationship: {
      type: String,
      required: true,
      enum: ["Family", "Friend", "Emergency Contact", "Travel Partner", "Doctor", "Other"],
      default: "Family",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.EmergencyContact ||
  mongoose.model("EmergencyContact", emergencyContactSchema);

