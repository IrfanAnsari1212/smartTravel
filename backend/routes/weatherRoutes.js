const express = require("express");
const router = express.Router();
const {
  getPointWeatherController,
  getRouteWeatherController,
} = require("../controllers/weatherController");

router.get("/point", getPointWeatherController);
router.post("/point", getPointWeatherController);
router.post("/route", getRouteWeatherController);

module.exports = router;
