const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  getNearbyEmergencyServices,
} = require("../controllers/emergencyController");

const router = express.Router();

// Public / auth nearby emergency facility lookup
router.get("/nearby", getNearbyEmergencyServices);

// Auth-protected emergency contacts management
router.use(requireAuth);
router.get("/contacts", getContacts);
router.post("/contacts", createContact);
router.put("/contacts/:id", updateContact);
router.delete("/contacts/:id", deleteContact);

module.exports = router;
