const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/requireAuth");

const {
  getTripHistory,
  planTrip,
  updateFavoriteTrip,
} = require("../controllers/tripController");

router.use(requireAuth);
router.get("/history", getTripHistory);
router.post("/route", planTrip);
router.patch("/:id/favorite", updateFavoriteTrip);

module.exports = router;
