const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const { chatWithAssistant, generateItinerary } = require("../controllers/aiController");

const router = express.Router();

router.use(requireAuth);

router.post("/chat", chatWithAssistant);
router.post("/itinerary", generateItinerary);

module.exports = router;
