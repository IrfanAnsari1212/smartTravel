const express = require("express");
const router = express.Router();

const {
  getTripHistory,
  planTrip,
  updateFavoriteTrip,
} = require("../controllers/tripController");

router.get("/history", getTripHistory);
router.post("/route", planTrip);
router.patch("/:id/favorite", updateFavoriteTrip);

module.exports = router;
