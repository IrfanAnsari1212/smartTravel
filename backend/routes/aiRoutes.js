const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const {
  chatWithAssistant,
  generateItinerary,
  generateStructuredRecommendations,
} = require("../controllers/aiController");

const router = express.Router();

router.use(requireAuth);

router.post("/chat", chatWithAssistant);
router.post("/itinerary", generateItinerary);
router.post("/structured", generateStructuredRecommendations);

module.exports = router;
