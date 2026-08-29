const express = require("express");
const {
  searchLocations,
  reverseGeocodeLocation,
} = require("../controllers/locationController");

const router = express.Router();

router.get("/search", searchLocations);
router.get("/reverse", reverseGeocodeLocation);

module.exports = router;
