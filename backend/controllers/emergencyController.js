const { z } = require("zod");
const EmergencyContact = require("../models/EmergencyContact");
const { getPlacesNearby } = require("../services/placeService");
const { reverseGeocode } = require("../services/locationService");

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  phone: z.string().trim().min(5, "Phone number is too short").max(25),
  relationship: z.enum(["Family", "Friend", "Emergency Contact", "Travel Partner", "Doctor", "Other"]).default("Family"),
  notes: z.string().trim().max(200).optional().default(""),
});

const nearbyEmergencyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(500).max(25000).optional().default(5000),
});

const getContacts = async (req, res, next) => {
  try {
    const contacts = await EmergencyContact.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    res.json(contacts);
  } catch (error) {
    next(error);
  }
};

const createContact = async (req, res, next) => {
  try {
    const data = contactSchema.parse(req.body);

    const contact = await EmergencyContact.create({
      ...data,
      userId: req.user.id,
    });

    res.status(201).json(contact);
  } catch (error) {
    next(error);
  }
};

const updateContact = async (req, res, next) => {
  try {
    const data = contactSchema.parse(req.body);

    const contact = await EmergencyContact.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!contact) {
      const error = new Error("Emergency contact not found");
      error.statusCode = 404;
      throw error;
    }

    res.json(contact);
  } catch (error) {
    next(error);
  }
};

const deleteContact = async (req, res, next) => {
  try {
    const result = await EmergencyContact.deleteOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (result.deletedCount === 0) {
      const error = new Error("Emergency contact not found");
      error.statusCode = 404;
      throw error;
    }

    res.json({ message: "Emergency contact deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const getNearbyEmergencyServices = async (req, res, next) => {
  try {
    const { lat, lon, radius } = nearbyEmergencyQuerySchema.parse(req.query);

    // Reverse geocode to get human-readable location address
    let humanAddress = "";
    try {
      const geoResult = await reverseGeocode(lat, lon);
      humanAddress = geoResult?.displayName || "";
    } catch {
      humanAddress = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    }

    const categories = ["police", "hospital", "pharmacy", "fuel", "mechanic"];
    const places = await getPlacesNearby(lat, lon, categories, radius);

    const police = places.filter((p) => p.category === "police");
    const hospitals = places.filter((p) => p.category === "hospital");
    const pharmacies = places.filter((p) => p.category === "pharmacy");
    const fuel = places.filter((p) => p.category === "fuel");
    const mechanics = places.filter((p) => p.category === "mechanic");

    res.json({
      location: {
        lat,
        lon,
        address: humanAddress,
      },
      services: {
        police,
        hospitals,
        pharmacies,
        fuel,
        mechanics,
        total: places.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  getNearbyEmergencyServices,
};

